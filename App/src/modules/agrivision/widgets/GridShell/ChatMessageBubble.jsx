/**
 * ChatMessageBubble.jsx — Message bubble subcomponent for ChatWidget
 */

import React from 'react';

export const MessageBubble = ({ message, onFeedback, styles }) => {
  const isUser = message.role === 'user';
  const bubbleStyle = {
    ...styles.messageBubble,
    ...(isUser ? styles.userBubble : styles.aiBubble),
  };

  const metadata = message.metadata;
  const hasDiseases = metadata?.diseases && metadata.diseases.length > 0;

  return (
    <div style={bubbleStyle}>
      <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>

      {hasDiseases && (
        <div style={styles.treatmentCard}>
          <div style={styles.treatmentTitle}>💊 Bệnh phát hiện được:</div>
          {metadata.diseases.map((d, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              • {d.disease_name_vi} ({(d.confidence * 100).toFixed(0)}%)
            </div>
          ))}
        </div>
      )}

      {!isUser && (
        <div style={styles.feedbackBtns}>
          <button
            style={styles.feedbackBtn}
            onClick={() => onFeedback?.(message.id, 5)}
            title="Hữu ích"
          >
            👍
          </button>
          <button
            style={styles.feedbackBtn}
            onClick={() => onFeedback?.(message.id, 1)}
            title="Chưa hữu ích"
          >
            👎
          </button>
        </div>
      )}
    </div>
  );
};
