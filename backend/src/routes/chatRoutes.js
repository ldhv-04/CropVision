/**
 * Chat Routes — REST API for AI chat powered by 9Router.
 *
 * All routes require authentication (JWT).
 *
 * Sessions:
 *   POST   /api/chat/sessions          — Create a new chat session
 *   GET    /api/chat/sessions          — List all sessions for the user
 *   GET    /api/chat/sessions/:id      — Get session with full message history
 *   PATCH  /api/chat/sessions/:id      — Rename session
 *   DELETE /api/chat/sessions/:id      — Delete session (cascades messages)
 *
 * Messages:
 *   POST   /api/chat/sessions/:id/messages — Send a message and get AI reply
 *
 * Consult (Inference-specific):
 *   POST   /api/chat/sessions/:id/consult — Consult with YOLO detection context
 *     Body: { content, detections: [{class_name, confidence}], inferenceId }
 *     Returns: AI response with treatment recommendations from disease knowledge base
 *
 * Disease Search:
 *   GET    /api/chat/diseases/search?q=keyword — Search diseases by keyword
 *     Query: q (min 2 chars), limit (default 10)
 *     Returns: Array of matching diseases with basic info
 *
 * Middleware:
 * - authenticateToken: Validates JWT, sets req.user.userId
 *
 * Rate Limiting:
 * - TODO: Add rate limiting per user (e.g., 100 requests/minute)
 */

const express = require('express');
const chatController = require('../controllers/chatController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All chat routes require authentication.
router.use(authenticateToken);

// Session CRUD
router.post('/sessions', chatController.createSession);
router.get('/sessions', chatController.listSessions);
router.get('/sessions/:sessionId', chatController.getSession);
router.patch('/sessions/:sessionId', chatController.renameSession);
router.delete('/sessions/:sessionId', chatController.deleteSession);

// Message send
router.post('/sessions/:sessionId/messages', chatController.sendMessage);

// Consult with inference context (disease diagnosis)
router.post('/sessions/:sessionId/consult', chatController.consultWithInference);

// Disease search
router.get('/diseases/search', chatController.searchDiseases);

module.exports = router;
