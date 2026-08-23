/**
 * AgronomyAssistantTab — Tab 4: Trợ Lý AI Nông Học Thực Địa
 *
 * Hỏi đáp nhanh về liều lượng phân thuốc, kỹ thuật chăm sóc cây và xử lý sâu bệnh.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { useTheme } from '../../@core/context/ThemeContext';

const QUICK_QUESTIONS = [
  'Lúa bị đạo ôn lá nên pha thuốc gì?',
  'Cà phê bị rụng quả non vào mùa mưa?',
  'Sầu riêng cơi đọt non bị cháy chóp?',
  'Cách hạ phèn cho đất ruộng lúa?',
];

const INITIAL_MESSAGES = [
  {
    id: '1',
    sender: 'ai',
    text: 'Chào Bác! Tôi là Trợ Lý Nông Học CropVision. Bác đang gặp khó khăn gì trên cây trồng (Lúa, Cà phê, Sầu riêng, Tiêu...)?',
    time: 'Vừa xong',
  },
];

export function AgronomyAssistantTab() {
  const { colors } = useTheme();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (textToSend = inputText) => {
    const text = textToSend.trim();
    if (!text) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: 'Bây giờ',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Fast AI response simulation
    setTimeout(() => {
      let reply = 'Đối với tình trạng này, bác nên kiểm tra độ ẩm đất và phun phòng các hoạt chất đặc trị đúng liều lượng khuyến cáo. Tránh bón thừa đạm Ure khi thời tiết sương mù nhiều.';
      if (text.includes('đạo ôn')) {
        reply = '🌾 Bệnh Đạo Ôn: Bác nên sử dụng hoạt chất Tricyclazole 75% WP (pha 25g/bình 25L). Phun vào sáng sớm khi ráo sương. Tuyệt đối ngưng bón đạm Ure và giữ mực nước ruộng 3-5cm.';
      } else if (text.includes('sầu riêng') || text.includes('cháy chóp')) {
        reply = '🍈 Sầu riêng cháy đọt: Đây là biểu hiện Thán Thư kết hợp sốc nước mùa mưa. Bác phun Azoxystrobin + Difenoconazole (150ml/phuy 200L) và xẻ rãnh thoát nước liếp ngay.';
      } else if (text.includes('cà phê')) {
        reply = '☕ Cà phê: Bác kiểm tra nấm Rỉ Sắt hoặc Thán thư cành. Phun Hexaconazole 50g/l ướt đẫm mặt dưới lá và bổ sung Bo-Canxi chống rụng quả non.';
      }

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        time: 'Vừa xong',
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 500);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Messages Scroll Area */}
      <ScrollView
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <View
              key={m.id}
              style={[
                styles.bubbleWrapper,
                isUser ? styles.bubbleRight : styles.bubbleLeft,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isUser
                    ? [styles.userBubble, { backgroundColor: colors.primary }]
                    : [styles.aiBubble, { backgroundColor: colors.surfaceCard, borderColor: colors.border }],
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    { color: isUser ? '#06090E' : colors.textPrimary },
                  ]}
                >
                  {m.text}
                </Text>
                <Text
                  style={[
                    styles.bubbleTime,
                    { color: isUser ? 'rgba(6,9,14,0.6)' : colors.textMuted },
                  ]}
                >
                  {m.time}
                </Text>
              </View>
            </View>
          );
        })}

        {isTyping && (
          <View style={[styles.typingBox, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <Text style={[styles.typingText, { color: colors.primary }]}>
              🤖 Bác sĩ cây trồng đang tra cứu phác đồ...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Quick Prompt Chips */}
      <View style={[styles.quickPromptSection, { borderTopColor: colors.borderLight }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.promptRow}>
            {QUICK_QUESTIONS.map((q, idx) => (
              <Pressable
                key={idx}
                style={[styles.promptChip, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
                onPress={() => handleSend(q)}
              >
                <Text style={[styles.promptText, { color: colors.textPrimary }]}>
                  💬 {q}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Input Row */}
      <View style={[styles.inputRow, { backgroundColor: colors.surfaceCard, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
          placeholder="Nhập câu hỏi nông học của Bác..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => handleSend()}
        />
        <Pressable
          style={[styles.sendBtn, { backgroundColor: colors.primary }]}
          onPress={() => handleSend()}
        >
          <Text style={styles.sendBtnText}>GỬI</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  chatScroll: { flex: 1 },
  chatContent: { padding: 16, paddingBottom: 20 },
  bubbleWrapper: { marginBottom: 14, flexDirection: 'row' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 10,
  },
  userBubble: {
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    borderBottomLeftRadius: 2,
    borderWidth: 1.5,
  },
  bubbleText: {
    fontSize: 14.5,
    lineHeight: 21,
    fontWeight: '600',
  },
  bubbleTime: {
    fontSize: 9.5,
    marginTop: 4,
    textAlign: 'right',
  },
  typingBox: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  typingText: { fontSize: 12, fontWeight: '700' },

  quickPromptSection: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  promptRow: { flexDirection: 'row', gap: 8 },
  promptChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  promptText: { fontSize: 12, fontWeight: '700' },

  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    borderTopWidth: 1.5,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  sendBtn: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#06090E',
    fontSize: 13.5,
    fontWeight: '900',
  },
});

export default AgronomyAssistantTab;
