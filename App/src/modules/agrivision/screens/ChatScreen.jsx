import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';
import api from '../../@core/api/apiClient';

const C = LIGHT_COLORS;

export default function ChatScreen() {
  const { initialContext } = useLocalSearchParams();
  const user = useAuthStore(s => s.user);
  
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', content: `Chào ${user?.fullName || 'bạn'}, tôi là trợ lý AI AgriVision. Tôi có thể giúp gì cho bạn hôm nay?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (initialContext) {
      setInput(initialContext);
    }
  }, [initialContext]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Create chat history format
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      const res = await api.post('/chat/ask', {
        question: userMessage.content,
        history,
        fieldContext: null // can be added if needed
      });

      if (res.data.success) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: res.data.data.answer
        }]);
      } else {
        throw new Error(res.data.message || 'Lỗi phản hồi từ AI');
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: `⚠️ Xin lỗi, có lỗi xảy ra: ${err.message}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    const isSystem = item.role === 'system';

    return (
      <View style={[
        styles.messageBubble, 
        isUser ? styles.userBubble : (isSystem ? styles.systemBubble : styles.aiBubble)
      ]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Hỏi AI về nông nghiệp..."
          placeholderTextColor={C.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <Pressable 
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={C.white} size="small" />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  userBubble: {
    backgroundColor: C.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: C.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  systemBubble: {
    backgroundColor: '#fee2e2',
    alignSelf: 'center',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  messageText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 22,
  },
  userText: {
    color: C.white,
  },
  aiText: {
    color: C.textPrimary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderColor: C.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: C.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: FONT_SIZE.md,
    color: C.textPrimary,
    maxHeight: 120,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  sendButtonDisabled: {
    backgroundColor: C.textMuted,
  },
  sendIcon: {
    color: C.white,
    fontSize: 18,
    fontWeight: 'bold',
  }
});
