/**
 * Chat Model — Data access layer for chat sessions and messages.
 *
 * Follows the same pattern as inferenceModel.js:
 * pool-based queries with parameterised SQL.
 */

const pool = require('../config/db');

// ── Sessions ────────────────────────────────────────────────

const createSession = async (userId, title, model) => {
  const query = `
    INSERT INTO chat_sessions (user_id, title, model)
    VALUES ($1, $2, $3)
    RETURNING id, title, model, created_at;
  `;
  const result = await pool.query(query, [userId, title || 'New Chat', model || 'ag/gemini-3-flash']);
  return result.rows[0];
};

const getSessionsByUser = async (userId) => {
  const query = `
    SELECT
      cs.id,
      cs.title,
      cs.model,
      cs.created_at,
      cs.updated_at,
      COUNT(cm.id) AS message_count
    FROM chat_sessions cs
    LEFT JOIN chat_messages cm ON cs.id = cm.session_id
    WHERE cs.user_id = $1
    GROUP BY cs.id
    ORDER BY cs.updated_at DESC;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

const getSessionById = async (sessionId, userId) => {
  const query = `
    SELECT id, user_id, title, model, created_at, updated_at
    FROM chat_sessions
    WHERE id = $1 AND user_id = $2;
  `;
  const result = await pool.query(query, [sessionId, userId]);
  return result.rows[0] || null;
};

const updateSessionTitle = async (sessionId, userId, title) => {
  const query = `
    UPDATE chat_sessions
    SET title = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 AND user_id = $3
    RETURNING id, title, updated_at;
  `;
  const result = await pool.query(query, [title, sessionId, userId]);
  return result.rows[0] || null;
};

const deleteSession = async (sessionId, userId) => {
  const query = `
    DELETE FROM chat_sessions
    WHERE id = $1 AND user_id = $2
    RETURNING id;
  `;
  const result = await pool.query(query, [sessionId, userId]);
  return result.rows[0] || null;
};

// ── Messages ────────────────────────────────────────────────

const insertMessage = async (sessionId, role, content, tokensUsed = 0, metadata = null) => {
  const query = `
    INSERT INTO chat_messages (session_id, role, content, tokens_used, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, role, content, tokens_used, metadata, created_at;
  `;
  const result = await pool.query(query, [sessionId, role, content, tokensUsed, metadata]);

  // Touch session updated_at so it sorts to the top.
  await pool.query(
    'UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [sessionId]
  );

  return result.rows[0];
};

const getMessagesBySession = async (sessionId, userId) => {
  // Verify ownership first.
  const session = await getSessionById(sessionId, userId);
  if (!session) return null;

  const query = `
    SELECT id, role, content, tokens_used, created_at
    FROM chat_messages
    WHERE session_id = $1
    ORDER BY created_at ASC;
  `;
  const result = await pool.query(query, [sessionId]);
  return { session, messages: result.rows };
};

module.exports = {
  createSession,
  getSessionsByUser,
  getSessionById,
  updateSessionTitle,
  deleteSession,
  insertMessage,
  getMessagesBySession,
};
