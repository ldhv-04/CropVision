/**
 * Mobile cultivation APIs for field owners.
 *
 * Station remains authoritative for geometry and publication. These handlers
 * only read the latest published snapshot and write separate cultivation rows.
 */

const pool = require('../config/db');

const LOG_TYPES = new Set([
  'watering',
  'fertilizing',
  'pesticide',
  'harvesting',
  'planting',
  'observation',
  'other',
]);

class ApiError extends Error {
  constructor(status, code, message, details = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const isUuid = value => (
  typeof value === 'string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
);

const parsePositiveInteger = value => {
  if (!/^[1-9]\d*$/.test(String(value ?? ''))) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

const parseJson = value => {
  if (!value) return [];
  return typeof value === 'string' ? JSON.parse(value) : value;
};

const findZone = (zonesData, zoneId) => (
  parseJson(zonesData).find(zone => Number(zone.id) === zoneId) || null
);

const publicationConflict = (latestPublicationVersion, requiresManualSetup, message) => (
  new ApiError(409, 'PUBLICATION_CONFLICT', message, {
    latestPublicationVersion,
    requiresReload: true,
    requiresManualSetup,
  })
);

const loadZoneContext = async (client, userId, fieldId, zoneIdValue, options = {}) => {
  if (!isUuid(fieldId)) {
    throw new ApiError(404, 'FIELD_NOT_FOUND', 'Field not found.');
  }

  const zoneId = parsePositiveInteger(zoneIdValue);
  if (!zoneId) {
    throw new ApiError(404, 'ZONE_NOT_FOUND', 'Zone not found.');
  }

  const fieldResult = await client.query(
    'SELECT id, name, owner_user_id FROM fields WHERE id = $1',
    [fieldId]
  );
  if (fieldResult.rows.length === 0) {
    throw new ApiError(404, 'FIELD_NOT_FOUND', 'Field not found.');
  }

  const field = fieldResult.rows[0];
  if (field.owner_user_id !== userId) {
    throw new ApiError(404, 'FIELD_NOT_FOUND', 'Field not found.');
  }

  const lockClause = options.lockPublished ? ' FOR SHARE' : '';
  const publishedResult = await client.query(`
    SELECT id, version, status, published_at, zones_data
    FROM field_zone_maps
    WHERE field_id = $1 AND status = 'published'
    ORDER BY version DESC, id DESC${lockClause}
  `, [fieldId]);

  if (publishedResult.rows.length === 0) {
    throw new ApiError(
      404,
      'NO_PUBLISHED_MAP',
      'No published zone map available for this field.'
    );
  }

  if (publishedResult.rows.length > 1) {
    throw publicationConflict(
      publishedResult.rows[0].version,
      false,
      'The published zone map is changing or inconsistent. Reload before continuing.'
    );
  }

  const historicalResult = await client.query(
    'SELECT zones_data FROM field_zone_maps WHERE field_id = $1',
    [fieldId]
  );
  const historicallyKnown = historicalResult.rows.some(row => findZone(row.zones_data, zoneId));
  if (!historicallyKnown) {
    throw new ApiError(404, 'ZONE_NOT_FOUND', 'Zone not found.');
  }

  const publication = publishedResult.rows[0];
  const zone = findZone(publication.zones_data, zoneId);
  if (!zone) {
    throw publicationConflict(
      publication.version,
      true,
      'This zone is no longer present in the latest published map. Reload and set it up manually.'
    );
  }

  if (Object.prototype.hasOwnProperty.call(options, 'publicationVersion')) {
    const requestedVersion = parsePositiveInteger(options.publicationVersion);
    if (!requestedVersion) {
      throw new ApiError(400, 'INVALID_PUBLICATION_VERSION', 'publicationVersion must be a positive integer.');
    }
    if (requestedVersion !== publication.version) {
      throw publicationConflict(
        publication.version,
        false,
        'The published zone map changed. Reload before saving.'
      );
    }
  }

  return {
    field,
    zoneId,
    zone,
    publication,
  };
};

const exactDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
};

const optionalText = (body, key, maxLength) => {
  if (!Object.prototype.hasOwnProperty.call(body, key)) return undefined;
  if (body[key] === null) return null;
  if (typeof body[key] !== 'string') {
    throw new ApiError(400, 'VALIDATION_ERROR', `${key} must be text.`);
  }
  const value = body[key].trim();
  if (value.length > maxLength) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${key} must be at most ${maxLength} characters.`);
  }
  return value || null;
};

const optionalDate = (body, key) => {
  const value = optionalText(body, key, 10);
  if (value !== undefined && value !== null && !exactDate(value)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${key} must use exact YYYY-MM-DD format.`);
  }
  return value;
};

const profilePayload = body => {
  if (typeof body.cropType !== 'string' || !body.cropType.trim()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'cropType is required.');
  }
  const cropType = body.cropType.trim();
  if (cropType.length > 100) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'cropType must be at most 100 characters.');
  }

  return {
    cropType,
    plantingDate: optionalDate(body, 'plantingDate') ?? null,
    expectedHarvestDate: optionalDate(body, 'expectedHarvestDate') ?? null,
    note: optionalText(body, 'note', 2000) ?? null,
  };
};

const logPayload = (body, existing = null) => {
  const isPatch = !!existing;
  const type = Object.prototype.hasOwnProperty.call(body, 'type') ? body.type : existing?.type;
  const eventDate = Object.prototype.hasOwnProperty.call(body, 'eventDate')
    ? body.eventDate
    : existing?.eventDate;

  if (typeof type !== 'string' || !LOG_TYPES.has(type)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'type is not an allowed cultivation log type.');
  }
  if (typeof eventDate !== 'string' || !exactDate(eventDate)) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'eventDate must use exact YYYY-MM-DD format.');
  }

  let amount = existing?.amount ?? null;
  if (Object.prototype.hasOwnProperty.call(body, 'amount')) {
    amount = body.amount;
    if (amount !== null && (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'amount must be a non-negative number.');
    }
  }

  const unit = optionalText(body, 'unit', 30);
  const product = optionalText(body, 'product', 150);
  const title = optionalText(body, 'title', 200);
  const note = optionalText(body, 'note', 2000);
  const resolvedUnit = unit !== undefined ? unit : (existing?.unit ?? null);
  if (amount !== null && !resolvedUnit) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'unit is required when amount is provided.');
  }

  if (isPatch) {
    const keys = ['type', 'eventDate', 'amount', 'unit', 'product', 'title', 'note'];
    if (!keys.some(key => Object.prototype.hasOwnProperty.call(body, key))) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'At least one log field must be provided.');
    }
  }

  return {
    type,
    eventDate,
    amount,
    unit: resolvedUnit,
    product: product !== undefined ? product : (existing?.product ?? null),
    title: title !== undefined ? title : (existing?.title ?? null),
    note: note !== undefined ? note : (existing?.note ?? null),
  };
};

const shapeDate = value => {
  if (!(value instanceof Date)) return value;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shapeProfile = row => row ? ({
  id: row.id,
  cropType: row.crop_type,
  plantingDate: shapeDate(row.started_at),
  expectedHarvestDate: shapeDate(row.expected_harvest_date),
  note: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
}) : null;

const shapeLog = row => ({
  id: row.id,
  type: row.activity_kind,
  eventDate: shapeDate(row.activity_date),
  amount: row.amount === null ? null : parseFloat(row.amount),
  unit: row.unit,
  product: row.product,
  title: row.title,
  note: row.note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  deletedAt: row.deleted_at || null,
});

const shapeMetadata = context => ({
  field: {
    id: context.field.id,
    name: context.field.name,
  },
  zone: {
    id: context.zoneId,
    code: context.zone.code || null,
    name: context.zone.name || null,
    area: context.zone.area === null || context.zone.area === undefined
      ? null
      : parseFloat(context.zone.area),
  },
  publication: {
    version: context.publication.version,
    status: context.publication.status,
    publishedAt: context.publication.published_at,
  },
});

const listLogs = async (client, userId, context, limit, offset) => {
  const result = await client.query(`
    SELECT id, activity_kind, activity_date, amount, unit, product, title, note,
           created_at, updated_at, deleted_at
    FROM zone_cultivation_logs
    WHERE user_id = $1
      AND field_id = $2
      AND stable_zone_id = $3
      AND field_zone_map_id = $4
      AND zone_map_version = $5
      AND source = 'mobile'
      AND deleted_at IS NULL
    ORDER BY activity_date DESC, created_at DESC, id DESC
    LIMIT $6 OFFSET $7
  `, [
    userId,
    context.field.id,
    context.zoneId,
    context.publication.id,
    context.publication.version,
    limit,
    offset,
  ]);
  return result.rows.map(shapeLog);
};

const pagination = query => {
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (!Number.isInteger(limit) || limit <= 0 || !Number.isInteger(offset) || offset < 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Pagination requires a positive integer limit and non-negative integer offset.');
  }
  return { limit: Math.min(limit, 100), offset };
};

const sendError = (res, error, label) => {
  if (error instanceof ApiError) {
    return res.status(error.status).json({
      success: false,
      code: error.code,
      message: error.message,
      ...error.details,
    });
  }
  console.error(`[Mobile Cultivation] ${label}:`, error.message);
  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Failed to process cultivation request.',
  });
};

const withTransaction = async callback => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
};

const getCultivation = async (req, res) => {
  try {
    const context = await loadZoneContext(pool, req.user.userId, req.params.fieldId, req.params.zoneId);
    const [profileResult, logs] = await Promise.all([
      pool.query(`
        SELECT id, crop_type, started_at, expected_harvest_date, notes, created_at, updated_at
        FROM zone_cultivation_profiles
        WHERE user_id = $1 AND field_id = $2 AND stable_zone_id = $3 AND lifecycle_state = 'current'
        LIMIT 1
      `, [req.user.userId, context.field.id, context.zoneId]),
      listLogs(pool, req.user.userId, context, 10, 0),
    ]);

    return res.json({
      success: true,
      data: {
        ...shapeMetadata(context),
        profile: shapeProfile(profileResult.rows[0]),
        logs,
      },
    });
  } catch (error) {
    return sendError(res, error, 'getCultivation');
  }
};

const getCultivationLogs = async (req, res) => {
  try {
    const context = await loadZoneContext(pool, req.user.userId, req.params.fieldId, req.params.zoneId);
    const page = pagination(req.query);
    const logs = await listLogs(pool, req.user.userId, context, page.limit, page.offset);
    return res.json({
      success: true,
      data: {
        ...shapeMetadata(context),
        logs,
        pagination: { ...page, count: logs.length },
      },
    });
  } catch (error) {
    return sendError(res, error, 'getCultivationLogs');
  }
};

const putCultivationProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const profile = await withTransaction(async client => {
      const context = await loadZoneContext(
        client,
        req.user.userId,
        req.params.fieldId,
        req.params.zoneId,
        { lockPublished: true, publicationVersion: body.publicationVersion }
      );
      const payload = profilePayload(body);
      const result = await client.query(`
        INSERT INTO zone_cultivation_profiles (
          user_id, field_id, stable_zone_id, field_zone_map_id, zone_map_version,
          lifecycle_state, crop_type, started_at, expected_harvest_date, notes
        )
        VALUES ($1, $2, $3, $4, $5, 'current', $6, $7, $8, $9)
        ON CONFLICT (user_id, field_id, stable_zone_id)
          WHERE lifecycle_state = 'current'
        DO UPDATE SET
          field_zone_map_id = EXCLUDED.field_zone_map_id,
          zone_map_version = EXCLUDED.zone_map_version,
          crop_type = EXCLUDED.crop_type,
          started_at = EXCLUDED.started_at,
          expected_harvest_date = EXCLUDED.expected_harvest_date,
          notes = EXCLUDED.notes,
          updated_at = NOW()
        RETURNING id, crop_type, started_at, expected_harvest_date, notes, created_at, updated_at
      `, [
        req.user.userId,
        context.field.id,
        context.zoneId,
        context.publication.id,
        context.publication.version,
        payload.cropType,
        payload.plantingDate,
        payload.expectedHarvestDate,
        payload.note,
      ]);
      return result.rows[0];
    });
    return res.json({ success: true, data: { profile: shapeProfile(profile) } });
  } catch (error) {
    return sendError(res, error, 'putCultivationProfile');
  }
};

const postCultivationLog = async (req, res) => {
  try {
    const body = req.body || {};
    const log = await withTransaction(async client => {
      const context = await loadZoneContext(
        client,
        req.user.userId,
        req.params.fieldId,
        req.params.zoneId,
        { lockPublished: true, publicationVersion: body.publicationVersion }
      );
      const payload = logPayload(body);
      const profileResult = await client.query(`
        SELECT id FROM zone_cultivation_profiles
        WHERE user_id = $1 AND field_id = $2 AND stable_zone_id = $3 AND lifecycle_state = 'current'
        LIMIT 1
      `, [req.user.userId, context.field.id, context.zoneId]);
      const result = await client.query(`
        INSERT INTO zone_cultivation_logs (
          user_id, field_id, stable_zone_id, field_zone_map_id, zone_map_version,
          profile_id, activity_kind, activity_date, amount, unit, product, title, note
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, activity_kind, activity_date, amount, unit, product, title, note,
                  created_at, updated_at, deleted_at
      `, [
        req.user.userId,
        context.field.id,
        context.zoneId,
        context.publication.id,
        context.publication.version,
        profileResult.rows[0]?.id ?? null,
        payload.type,
        payload.eventDate,
        payload.amount,
        payload.unit,
        payload.product,
        payload.title,
        payload.note,
      ]);
      return result.rows[0];
    });
    return res.status(201).json({ success: true, data: { log: shapeLog(log) } });
  } catch (error) {
    return sendError(res, error, 'postCultivationLog');
  }
};

const patchCultivationLog = async (req, res) => {
  try {
    const body = req.body || {};
    const log = await withTransaction(async client => {
      const context = await loadZoneContext(
        client,
        req.user.userId,
        req.params.fieldId,
        req.params.zoneId,
        { lockPublished: true, publicationVersion: body.publicationVersion }
      );
      const logId = parsePositiveInteger(req.params.logId);
      if (!logId) throw new ApiError(404, 'LOG_NOT_FOUND', 'Log not found.');

      const existingResult = await client.query(`
        SELECT id, activity_kind AS type, activity_date::text AS "eventDate",
               amount::float AS amount, unit, product, title, note
        FROM zone_cultivation_logs
        WHERE id = $1 AND user_id = $2 AND field_id = $3 AND stable_zone_id = $4
          AND field_zone_map_id = $5 AND zone_map_version = $6
          AND source = 'mobile' AND deleted_at IS NULL
        FOR UPDATE
      `, [
        logId,
        req.user.userId,
        context.field.id,
        context.zoneId,
        context.publication.id,
        context.publication.version,
      ]);
      if (existingResult.rows.length === 0) {
        throw new ApiError(404, 'LOG_NOT_FOUND', 'Log not found.');
      }
      const payload = logPayload(body, existingResult.rows[0]);
      const result = await client.query(`
        UPDATE zone_cultivation_logs
        SET activity_kind = $1, activity_date = $2, amount = $3, unit = $4,
            product = $5, title = $6, note = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING id, activity_kind, activity_date, amount, unit, product, title, note,
                  created_at, updated_at, deleted_at
      `, [
        payload.type,
        payload.eventDate,
        payload.amount,
        payload.unit,
        payload.product,
        payload.title,
        payload.note,
        logId,
      ]);
      return result.rows[0];
    });
    return res.json({ success: true, data: { log: shapeLog(log) } });
  } catch (error) {
    return sendError(res, error, 'patchCultivationLog');
  }
};

const deleteCultivationLog = async (req, res) => {
  try {
    const log = await withTransaction(async client => {
      const context = await loadZoneContext(
        client,
        req.user.userId,
        req.params.fieldId,
        req.params.zoneId,
        { lockPublished: true, publicationVersion: req.query.publicationVersion }
      );
      const logId = parsePositiveInteger(req.params.logId);
      if (!logId) throw new ApiError(404, 'LOG_NOT_FOUND', 'Log not found.');

      const result = await client.query(`
        UPDATE zone_cultivation_logs
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND field_id = $3 AND stable_zone_id = $4
          AND field_zone_map_id = $5 AND zone_map_version = $6
          AND source = 'mobile' AND deleted_at IS NULL
        RETURNING id, activity_kind, activity_date, amount, unit, product, title, note,
                  created_at, updated_at, deleted_at
      `, [
        logId,
        req.user.userId,
        context.field.id,
        context.zoneId,
        context.publication.id,
        context.publication.version,
      ]);
      if (result.rows.length === 0) {
        throw new ApiError(404, 'LOG_NOT_FOUND', 'Log not found.');
      }
      return result.rows[0];
    });
    return res.json({ success: true, data: { log: shapeLog(log) } });
  } catch (error) {
    return sendError(res, error, 'deleteCultivationLog');
  }
};

module.exports = {
  getCultivation,
  getCultivationLogs,
  putCultivationProfile,
  postCultivationLog,
  patchCultivationLog,
  deleteCultivationLog,
};
