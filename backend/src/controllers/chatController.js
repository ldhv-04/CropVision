/**
 * Chat Controller — HTTP handlers for chat endpoints.
 *
 * Follows the same pattern as inferenceController.js:
 * - Validate auth from req.user (set by authenticateToken middleware)
 * - Delegate to service layer
 * - Return consistent { success, message, data } envelope
 *
 * Endpoints:
 * - Session CRUD: create, list, get, rename, delete
 * - Messages: send (regular), consult (with YOLO context)
 * - Disease search: keyword search for autocomplete
 *
 * Error Handling:
 * - Validation errors: 400 (bad request)
 * - Auth errors: 401 (unauthorized)
 * - Not found: 404
 * - Server errors: 500 (with generic message to client)
 * - 9Router errors: 502 (bad gateway)
 * - Rate limit: 429 (too many requests)
 */

const chatService = require('../services/chatService');

// ── Sessions ────────────────────────────────────────────────

const createSession = async (req, res) => {
  try {
    const { title, model } = req.body || {};
    const session = await chatService.createSession(req.user.userId, title, model);
    res.status(201).json({ success: true, message: 'Tao phien chat thanh cong.', data: session });
  } catch (error) {
    console.error('[Chat] createSession error:', error.message);
    res.status(error.status || 500).json({ success: false, message: 'Khong the tao phien chat.' });
  }
};

const listSessions = async (req, res) => {
  try {
    const sessions = await chatService.listSessions(req.user.userId);
    res.json({ success: true, message: 'Lay danh sach phien chat thanh cong.', data: sessions });
  } catch (error) {
    console.error('[Chat] listSessions error:', error.message);
    res.status(500).json({ success: false, message: 'Khong the tai danh sach phien chat.' });
  }
};

const getSession = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    if (isNaN(sessionId)) {
      return res.status(400).json({ success: false, message: 'Session ID khong hop le.' });
    }

    const result = await chatService.getSession(sessionId, req.user.userId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Khong tim thay phien chat.' });
    }

    res.json({ success: true, message: 'Lay phien chat thanh cong.', data: result });
  } catch (error) {
    console.error('[Chat] getSession error:', error.message);
    res.status(500).json({ success: false, message: 'Khong the tai phien chat.' });
  }
};

const renameSession = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    const { title } = req.body || {};

    if (isNaN(sessionId)) {
      return res.status(400).json({ success: false, message: 'Session ID khong hop le.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Tieu de khong duoc de trong.' });
    }

    const updated = await chatService.renameSession(sessionId, req.user.userId, title.trim());
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Khong tim thay phien chat.' });
    }

    res.json({ success: true, message: 'Cap nhat tieu de thanh cong.', data: updated });
  } catch (error) {
    console.error('[Chat] renameSession error:', error.message);
    res.status(500).json({ success: false, message: 'Khong the cap nhat tieu de.' });
  }
};

const deleteSession = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    if (isNaN(sessionId)) {
      return res.status(400).json({ success: false, message: 'Session ID khong hop le.' });
    }

    const deleted = await chatService.deleteSession(sessionId, req.user.userId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Khong tim thay phien chat.' });
    }

    res.json({ success: true, message: 'Xoa phien chat thanh cong.', data: deleted });
  } catch (error) {
    console.error('[Chat] deleteSession error:', error.message);
    res.status(500).json({ success: false, message: 'Khong the xoa phien chat.' });
  }
};

// ── Messages ────────────────────────────────────────────────

const sendMessage = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    const { content } = req.body || {};

    if (isNaN(sessionId)) {
      return res.status(400).json({ success: false, message: 'Session ID khong hop le.' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Noi dung tin nhan khong duoc de trong.' });
    }

    const result = await chatService.sendMessage(sessionId, req.user.userId, content.trim());
    res.json({ success: true, message: 'Gui tin nhan thanh cong.', data: result });
  } catch (error) {
    console.error('[Chat] sendMessage error:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Loi khi gui tin nhan.' });
  }
};

// ── Consult (Inference-specific) ────────────────────────────

const consultWithInference = async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    const { content, detections, inferenceId, fieldId } = req.body || {};

    if (isNaN(sessionId)) {
      return res.status(400).json({ success: false, message: 'Session ID khong hop le.' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Noi dung tin nhan khong duoc de trong.' });
    }

    const result = await chatService.consultWithInference(
      sessionId,
      req.user.userId,
      content.trim(),
      detections || [],
      inferenceId || null,
      fieldId || null
    );

    res.json({ success: true, message: 'Tu van thanh cong.', data: result });
  } catch (error) {
    console.error('[Chat] consultWithInference error:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Loi khi tu van.' });
  }
};

// ── Search Diseases ─────────────────────────────────────────

const searchDiseases = async (req, res) => {
  try {
    const { q, limit } = req.query || {};
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Tu khoa tim kiem it nhat 2 ky tu.' });
    }

    const diseaseService = require('../services/diseaseService');
    const results = await diseaseService.searchDiseases(q.trim(), parseInt(limit, 10) || 10);
    res.json({ success: true, message: 'Tim kiem thanh cong.', data: results });
  } catch (error) {
    console.error('[Chat] searchDiseases error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi tim kiem benh.' });
  }
};

const getDiseaseByClass = async (req, res) => {
  try {
    const { diseaseClass } = req.params;
    if (!diseaseClass) {
      return res.status(400).json({ success: false, message: 'Class name khong duoc de trong.' });
    }

    const diseaseService = require('../services/diseaseService');
    const result = await diseaseService.getDiseaseByClass(diseaseClass);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Khong tim thay thong tin benh.' });
    }

    res.json({ success: true, message: 'Lay thong tin benh thanh cong.', data: result });
  } catch (error) {
    console.error('[Chat] getDiseaseByClass error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay thong tin benh.' });
  }
};

module.exports = {
  createSession,
  listSessions,
  getSession,
  renameSession,
  deleteSession,
  sendMessage,
  consultWithInference,
  searchDiseases,
  getDiseaseByClass,
};

