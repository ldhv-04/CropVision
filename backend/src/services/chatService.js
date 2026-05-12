/**
 * Chat Service — Proxies chat requests to 9Router and persists messages.
 *
 * 9Router exposes an OpenAI-compatible /v1/chat/completions endpoint.
 * This service builds the conversation history from DB, sends it,
 * and stores both the user message and assistant reply.
 *
 * Architecture:
 * - Regular chat: sendMessage() — generic AI conversation
 * - Consult chat: consultWithInference() — disease-specific with YOLO context
 *
 * Flow:
 * 1. Verify session ownership
 * 2. Load conversation history from DB
 * 3. Build OpenAI-compatible payload with system prompt
 * 4. Call 9Router /v1/chat/completions
 * 5. Persist user + assistant messages to DB
 * 6. Return assistant reply + metadata
 */

const axios = require('axios');
const chatModel = require('../models/chatModel');
const diseaseService = require('./diseaseService');

const NINEROUTER_URL = (process.env.NINEROUTER_URL || 'http://localhost:20128').replace(/\/+$/, '');
const NINEROUTER_KEY = process.env.NINEROUTER_KEY || '';

const DEFAULT_MODEL = 'ag/gemini-3-flash';
const MAX_HISTORY_MESSAGES = 50; // Cap context window to avoid huge payloads.

// ── System Prompt for Plant Disease Expert ──────────────────

const SYSTEM_PROMPT = `Bạn là CropVision AI — trợ lý chuyên gia về bảo vệ thực vật (BVTV) tại Việt Nam.

NHIỆM VỤ:
- Tư vấn về bệnh cây trồng dựa trên kết quả phát hiện từ AI (YOLO model)
- Đề xuất phương pháp điều trị phù hợp với điều kiện Việt Nam
- Gợi ý thuốc BVTV có sẵn trên thị trường Việt Nam
- Trả lời câu hỏi về bệnh cây trồng, phòng trừ, chăm sóc

NGUYÊN TẮC:
1. Ưu tiên giải pháp sinh học trước, hóa học sau
2. Luôn đề cập biện pháp an toàn khi dùng thuốc BVTV
3. Nhắc về thời gian cách ly trước thu hoạch
4. Phù hợp với điều kiện khí hậu Việt Nam (nhiệt đới, ẩm)
5. Sử dụng tiếng Việt tự nhiên, thân thiện, dễ hiểu
6. Không bịa thông tin — chỉ tư vấn dựa trên dữ liệu được cung cấp

ĐỊNH DẠNG TRẢ LỜI:
- **Phương pháp điều trị**: Mô tả ngắn gọn, dễ thực hiện
- **Thuốc gợi ý**: Tên thương mại + hoạt chất + liều lượng + cách dùng
- **Biện pháp phòng ngừa**: Đơn giản, hiệu quả
- **Lưu ý an toàn**: Bắt buộc nếu dùng thuốc hóa học

KHI KHÔNG CÓ THÔNG TIN:
"Hiện tại tôi chưa có thông tin chi tiết về bệnh này trong cơ sở dữ liệu. Bạn có thể:
1. Chụp ảnh rõ hơn để AI phát hiện lại
2. Mô tả triệu chứng cụ thể hơn
3. Liên hệ chuyên gia BVTV tại địa phương"

BIỆN PHÁP AN TOÀN (code-level):
- Nếu confidence < 40%: "Kết quả phát hiện chưa đủ tin cậy, vui lòng chụp ảnh rõ hơn"
- Nếu bệnh không có trong DB: "Chưa có thông tin điều trị, đang cập nhật"
- Luôn có disclaimer: "Tham khảo ý kiến chuyên gia BVTV tại địa phương để được tư vấn chính xác"`;

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
 * Build messages payload with system prompt and optional disease context.
 *
 * @param {Object[]} dbMessages - Existing messages from DB
 * @param {string} newUserContent - New user message
 * @param {string} diseaseContext - Optional disease info for LLM context
 * @returns {Object[]} OpenAI-compatible messages array
 */
const buildMessagesPayload = (dbMessages, newUserContent, diseaseContext = null) => {
  const messages = [];

  // System prompt with optional disease context
  let systemContent = SYSTEM_PROMPT;
  if (diseaseContext) {
    systemContent += `\n\n---\n\n## THÔNG TIN BỆNH TỪ HỆ THỐNG:\n\n${diseaseContext}\n\nHãy tư vấn dựa trên thông tin trên.`;
  }
  messages.push({ role: 'system', content: systemContent });

  // Conversation history (cap to avoid huge payloads)
  const history = dbMessages.slice(-MAX_HISTORY_MESSAGES).map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
  messages.push(...history);

  // New user message
  messages.push({ role: 'user', content: newUserContent });
  return messages;
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

/**
 * Consult with inference context — specialized for disease diagnosis.
 *
 * This is the main function for the chatbot feature:
 * 1. Takes YOLO detection results
 * 2. Looks up disease info from knowledge base
 * 3. Injects context into LLM prompt
 * 4. Returns AI response with treatment recommendations
 *
 * @param {number} sessionId - Chat session ID
 * @param {number} userId - User ID
 * @param {string} content - User's question
 * @param {Object[]} detections - YOLO detections [{class_name, confidence}, ...]
 * @param {number} inferenceId - Optional inference sample ID
 * @returns {Object} AI response with recommendations
 */
const consultWithInference = async (sessionId, userId, content, detections = [], inferenceId = null) => {
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

  // 3. Build disease context from detections
  let diseaseContext = null;
  let topDiseases = [];

  if (detections && detections.length > 0) {
    topDiseases = await diseaseService.getTopDiseases(detections, 3, 0.4);
    if (topDiseases.length > 0) {
      diseaseContext = diseaseService.buildMultiDiseaseContext(topDiseases);
    }
  }

  // 4. Build OpenAI-compatible payload with disease context
  const messages = buildMessagesPayload(dbMessages, content, diseaseContext);
  const model = session.model || DEFAULT_MODEL;

  // 5. Call 9Router.
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

  // 6. Persist messages with metadata
  const metadata = topDiseases.length > 0 ? {
    diseases: topDiseases.map(d => ({
      disease_class: d.disease_class,
      disease_name_vi: d.disease_name_vi,
      confidence: d.confidence,
    })),
    inference_id: inferenceId,
  } : null;

  const userMsg = await chatModel.insertMessage(sessionId, 'user', content, 0, metadata);
  const assistantMsg = await chatModel.insertMessage(sessionId, 'assistant', assistantContent, tokensUsed);

  // 7. Return assistant reply + recommendations
  return {
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    model,
    tokensUsed,
    recommendations: topDiseases,
  };
};

module.exports = {
  createSession,
  listSessions,
  getSession,
  renameSession,
  deleteSession,
  sendMessage,
  consultWithInference,
};
