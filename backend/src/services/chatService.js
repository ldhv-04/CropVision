/**
 * Chat Service — Proxies chat requests to 9Router and persists messages.
 *
 * 9Router exposes an OpenAI-compatible /v1/chat/completions endpoint.
 * This service builds the conversation history from DB, sends it,
 * and stores both the user message and assistant reply.
 */

const axios = require('axios');
const chatModel = require('../models/chatModel');

const NINEROUTER_URL = (process.env.NINEROUTER_URL || 'http://localhost:20128').replace(/\/+$/, '');
const NINEROUTER_KEY = process.env.NINEROUTER_KEY || '';

const DEFAULT_MODEL = 'ag/gemini-3-flash';
const MAX_HISTORY_MESSAGES = 50; // Cap context window to avoid huge payloads.

// ── Helpers ─────────────────────────────────────────────────

/**
 * Build the Authorization header for 9Router.
 * Omitted entirely when no key is configured (auth disabled).
 */
const buildAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  if (NINEROUTER_KEY) {
    headers['Authorization'] = `Bearer ${NINEROUTER_KEY}`;
  }
  return headers;
};

/**
 * Convert DB message rows into OpenAI messages array format.
 * Keeps only the most recent MAX_HISTORY_MESSAGES entries.
 */
const buildMessagesPayload = (dbMessages, newUserContent) => {
  const history = dbMessages.slice(-MAX_HISTORY_MESSAGES).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));

  history.push({ role: 'user', content: newUserContent });
  return history;
};

// ── Public API ──────────────────────────────────────────────

/**
 * Create a new chat session.
 */
const createSession = async (userId, title, model) => {
  return chatModel.createSession(userId, title, model || DEFAULT_MODEL);
};

/**
 * List all sessions for a user.
 */
const listSessions = async (userId) => {
  return chatModel.getSessionsByUser(userId);
};

/**
 * Get a single session with all its messages.
 */
const getSession = async (sessionId, userId) => {
  return chatModel.getMessagesBySession(sessionId, userId);
};

/**
 * Update session title.
 */
const renameSession = async (sessionId, userId, title) => {
  return chatModel.updateSessionTitle(sessionId, userId, title);
};

/**
 * Delete a session (cascades to messages).
 */
const deleteSession = async (sessionId, userId) => {
  return chatModel.deleteSession(sessionId, userId);
};

/**
 * Send a message to 9Router and persist both user + assistant messages.
 *
 * Flow:
 * 1. Verify session ownership
 * 2. Load existing conversation history from DB
 * 3. Append new user message to payload
 * 4. Call 9Router /v1/chat/completions
 * 5. Persist user message and assistant reply to DB
 * 6. Return the assistant reply
 */
const sendMessage = async (sessionId, userId, content) => {
  // 1. Verify ownership.
  const session = await chatModel.getSessionById(sessionId, userId);
  if (!session) {
    const err = new Error('Khong tim thay phien chat.');
    err.status = 404;
    throw err;
  }

  // 2. Load existing history.
  const existing = await chatModel.getMessagesBySession(sessionId, userId);
  const dbMessages = existing?.messages || [];

  // 3. Build OpenAI-compatible payload.
  const messages = buildMessagesPayload(dbMessages, content);
  const model = session.model || DEFAULT_MODEL;

  // 4. Call 9Router.
  let assistantContent = '';
  let tokensUsed = 0;

  try {
    const response = await axios.post(
      `${NINEROUTER_URL}/v1/chat/completions`,
      { model, messages, stream: false },
      { headers: buildAuthHeaders(), timeout: 60000 }
    );

    const choice = response.data?.choices?.[0];
    assistantContent = choice?.message?.content || '';
    tokensUsed = response.data?.usage?.total_tokens || 0;
  } catch (error) {
    const status = error.response?.status;
    const detail = error.response?.data?.error?.message || error.message;
    console.error(`[Chat] 9Router error (${status}): ${detail}`);

    const err = new Error('Loi khi goi dich vu AI. Vui long thu lai.');
    err.status = status === 429 ? 429 : 502;
    throw err;
  }

  // 5. Persist both messages.
  const userMsg = await chatModel.insertMessage(sessionId, 'user', content, 0);
  const assistantMsg = await chatModel.insertMessage(sessionId, 'assistant', assistantContent, tokensUsed);

  // 6. Return assistant reply + metadata.
  return {
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    model,
    tokensUsed,
  };
};

module.exports = {
  createSession,
  listSessions,
  getSession,
  renameSession,
  deleteSession,
  sendMessage,
};
