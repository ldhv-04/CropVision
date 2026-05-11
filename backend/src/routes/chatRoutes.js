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

module.exports = router;
