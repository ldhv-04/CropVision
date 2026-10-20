/**
 * ChatWidget — AI Chat Sidebar for Inference Page
 *
 * GridShell widget that displays a chatbot interface for plant disease consultation.
 * Connects to existing /api/chat/sessions and /api/chat/sessions/:id/consult.
 *
 * Props (from GridShell / inference store):
 *   detections   — YOLO detection results [{class_name, confidence, ...}]
 *   sampleId     — Inference sample ID for linking chat to inference (nullable)
 *   imageName    — Name of the sample for session title
 *
 * Features:
 * - Message list with user/AI bubbles
 * - Treatment cards with formatted disease info
 * - Typing indicator during AI response
 * - Auto-scroll to latest message
 * - Integration with inference detection results
 * - Auto-consult on first load if detections available
 * - New chat button to start fresh session
 * - Feedback buttons (thumbs up/down) for AI responses
 *
 * API Endpoints Used:
 * - POST /api/chat/sessions — Create new session
 * - POST /api/chat/sessions/:id/messages — Send regular message
 * - POST /api/chat/sessions/:id/consult — Send with disease context
 *
 * State Management:
 * - Local state: sessionId, messages, inputValue, isLoading, isTyping
 * - Inference store: detections, imageName, sampleId (read-only)
 *
 * Bug Fixes:
 * - Fixed inferenceId undefined: now uses sampleId from inference store
 * - Fixed detections null: defaults to empty array in consult request
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SPACING, RADIUS, FONT_SIZE } from '../../../@core/constants/theme';
import { useInferenceStore } from '../../../inference/store/useInferenceStore';
import { apiRequest as coreApiRequest } from '../../../@core/api/apiClient';
import { useAuthStore } from '../../../@core/auth/useAuthStore';
import { useTheme } from '../../../@core/context/ThemeContext';
import { getStyles } from './ChatWidgetStyles';
import { MessageBubble } from './ChatMessageBubble';

// ── API Helper ──────────────────────────────────────────────

/**
 * Wrapper around core apiRequest that prepends /api/chat to the path.
 * Gets the token from the auth store automatically.
 */
const chatApiRequest = async (path, options = {}) => {
  const token = useAuthStore.getState().token;
  return coreApiRequest(`/api/chat${path}`, options, token);
};

// ── Main ChatWidget Component ───────────────────────────────

export const ChatWidget = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Get inference data from Zustand store
  const { detections, imageName, sampleId } = useInferenceStore();
  
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messageListRef = useRef(null);
  const hasAutoConsulted = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Create or load session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        // Try to create a new session for this inference
        const title = imageName ? `Tư vấn: ${imageName}` : 'Tư vấn bệnh cây trồng';
        const res = await chatApiRequest('/sessions', {
          method: 'POST',
          body: JSON.stringify({ title }),
        });
        setSessionId(res.data.id);

        // Auto-consult if detections available (only once)
        if (detections && detections.length > 0 && !hasAutoConsulted.current) {
          hasAutoConsulted.current = true;
          const detectionSummary = detections
            .map(d => `• ${d.class_name} (${(d.confidence * 100).toFixed(0)}%)`)
            .join('\n');
          
          await sendMessageInternal(
            res.data.id,
            `Phân tích các bệnh phát hiện được:\n${detectionSummary}\n\nHãy tư vấn phương pháp điều trị.`,
            true
          );
        }
      } catch (error) {
        console.error('[ChatWidget] Init error:', error);
      }
    };

    initSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Internal send message function
   * 
   * @param {number} sid - Session ID
   * @param {string} content - Message content
   * @param {boolean} isConsult - Whether to use consult endpoint (with disease context)
   */
  const sendMessageInternal = async (sid, content, isConsult = false) => {
    if (!content.trim() || !sid) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const endpoint = isConsult ? `/sessions/${sid}/consult` : `/sessions/${sid}/messages`;
      const body = isConsult
        ? { content: content.trim(), detections: detections || [], inferenceId: sampleId }
        : { content: content.trim() };

      const res = await chatApiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const aiMsg = {
        id: res.data.assistantMessage?.id || Date.now() + 1,
        role: 'assistant',
        content: res.data.assistantMessage?.content || res.data.content || '',
        metadata: res.data.recommendations ? { diseases: res.data.recommendations } : null,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('[ChatWidget] Send error:', error);
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `⚠️ Lỗi: ${error.message}. Vui lòng thử lại.`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle send button click
  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading) return;
    const content = inputValue;
    setInputValue('');
    setIsLoading(true);
    sendMessageInternal(sessionId, content, false).finally(() => setIsLoading(false));
  }, [inputValue, isLoading, sessionId]);

  // Handle Enter key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Handle feedback
  const handleFeedback = useCallback(async (messageId, rating) => {
    try {
      // TODO: Call feedback API
      console.log('[ChatWidget] Feedback:', messageId, rating);
    } catch (error) {
      console.error('[ChatWidget] Feedback error:', error);
    }
  }, []);

  // New chat
  const handleNewChat = useCallback(async () => {
    try {
      const res = await chatApiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({ title: 'Cuộc trò chuyện mới' }),
      });
      setSessionId(res.data.id);
      setMessages([]);
    } catch (error) {
      console.error('[ChatWidget] New chat error:', error);
    }
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>🤖 CropVision AI</h3>
        <button style={styles.newChatBtn} onClick={handleNewChat}>
          + Mới
        </button>
      </div>

      {/* Message List */}
      <div style={styles.messageList} ref={messageListRef}>
        {messages.length === 0 && !isTyping && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>🌱</div>
            <div>
              Chào bạn! Tôi là trợ lý AI chuyên gia về bệnh cây trồng.
              <br />
              Hãy tải ảnh lên để tôi phân tích và tư vấn điều trị.
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onFeedback={handleFeedback}
            styles={styles}
          />
        ))}

        {isTyping && (
          <div style={styles.typingIndicator}>
            🤖 AI đang phân tích...
          </div>
        )}
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <input
          style={styles.input}
          type="text"
          placeholder="Nhập câu hỏi về bệnh cây trồng..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || !sessionId}
        />
        <button
          style={{
            ...styles.sendBtn,
            ...(isLoading || !sessionId ? styles.sendBtnDisabled : {}),
          }}
          onClick={handleSend}
          disabled={isLoading || !sessionId}
        >
          📤
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
