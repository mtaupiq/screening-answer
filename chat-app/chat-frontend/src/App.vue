<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import 'emoji-picker-element';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  timestamp: string;
}

// Generate a unique user identity per window/tab instance
const currentUserId = ref<string>(`user_${Math.random().toString(36).substring(2, 7)}`);
const avatarUrl = ref<string>(`https://api.dicebear.com/7.x/bottts/svg?seed=${currentUserId.value}`);

const messages = ref<Message[]>([]);
const newMessage = ref<string>('');
const isConnected = ref<boolean>(false);
const showEmojiPicker = ref<boolean>(false);

const chatContainer = ref<HTMLDivElement | null>(null);
const emojiPickerRef = ref<HTMLElement | null>(null);

let socket: WebSocket | null = null;

const connectWebSocket = () => {
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    isConnected.value = true;
  };

  socket.onmessage = (event: MessageEvent) => {
    const data: Message = JSON.parse(event.data);
    messages.value.push(data);
    scrollToBottom();
  };

  socket.onclose = () => {
    isConnected.value = false;
    // Attempt reconnect after 3 seconds
    setTimeout(connectWebSocket, 3000);
  };
};

const sendMessage = () => {
  if (!newMessage.value.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;

  const payload: Message = {
    id: Date.now().toString(),
    senderId: currentUserId.value,
    senderName: currentUserId.value,
    avatar: avatarUrl.value,
    text: newMessage.value.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  socket.send(JSON.stringify(payload));
  newMessage.value = '';
  showEmojiPicker.value = false;
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTo({
        top: chatContainer.value.scrollHeight,
        behavior: 'smooth',
      });
    }
  });
};

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};

const handleEmojiSelect = (event: any) => {
  if (event.detail && event.detail.unicode) {
    newMessage.value += event.detail.unicode;
  }
};

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (showEmojiPicker.value && !target.closest('.emoji-wrapper')) {
    showEmojiPicker.value = false;
  }
};

onMounted(() => {
  connectWebSocket();
  document.addEventListener('click', handleClickOutside);

  nextTick(() => {
    if (emojiPickerRef.value) {
      emojiPickerRef.value.addEventListener('emoji-click', handleEmojiSelect);
    }
  });
});

onUnmounted(() => {
  if (socket) socket.close();
  document.removeEventListener('click', handleClickOutside);
  if (emojiPickerRef.value) {
    emojiPickerRef.value.removeEventListener('emoji-click', handleEmojiSelect);
  }
});
</script>

<template>
  <div class="chat-card">
    <!-- Header -->
    <header class="chat-header">
      <div class="channel-info">
        <span class="hashtag">#</span>
        <span class="channel-name">general</span>
      </div>
      <div class="status-indicator" :class="{ online: isConnected }">
        {{ isConnected ? 'Connected' : 'Connecting...' }}
      </div>
    </header>

    <!-- Message List -->
    <div class="messages-container" ref="chatContainer">
      <TransitionGroup name="message-pop">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-wrapper"
          :class="{ 'mine': msg.senderId === currentUserId }"
        >
          <img
            v-if="msg.senderId !== currentUserId"
            :src="msg.avatar"
            class="avatar"
            alt="avatar"
          />
          <div class="bubble">
            <p class="text">{{ msg.text }}</p>
          </div>
          <img
            v-if="msg.senderId === currentUserId"
            :src="msg.avatar"
            class="avatar"
            alt="avatar"
          />
        </div>
      </TransitionGroup>
    </div>

    <!-- Input Box -->
    <footer class="input-container">
      <form @submit.prevent="sendMessage" class="input-form">
        <div class="input-wrapper">
          <input
            v-model="newMessage"
            type="text"
            placeholder="Type a message..."
            class="chat-input"
          />

          <!-- Emoji Button & Popup -->
          <div class="emoji-wrapper">
            <button
              type="button"
              class="emoji-toggle-btn"
              @click.stop="toggleEmojiPicker"
              title="Add Emoji"
            >
              😊
            </button>

            <!-- Popup Menu -->
            <Transition name="fade">
              <div v-show="showEmojiPicker" class="emoji-picker-popover">
                <emoji-picker ref="emojiPickerRef" class="light"></emoji-picker>
              </div>
            </Transition>
          </div>
        </div>

        <button type="submit" class="send-btn" :disabled="!newMessage.trim()">
          <svg viewBox="0 0 24 24" class="send-icon">
            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </footer>
  </div>
</template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}
</style>

<style scoped>
/* Main Container */
.chat-card {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
  background-size: 16px 16px;
  overflow: hidden;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

/* Header */
.chat-header {
  flex-shrink: 0;
  padding: 16px 20px;
  background: #ffffff;
  border-bottom: 1px solid #edf2f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.channel-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 1.1rem;
  color: #2d3748;
}

.status-indicator {
  font-size: 0.8rem;
  color: #e53e3e;
  font-weight: 500;
}

.status-indicator.online {
  color: #38a169;
}

/* Message Area */
.messages-container {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.message-wrapper.mine {
  justify-content: flex-end;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e2e8f0;
}

.bubble {
  max-width: 70%;
  padding: 10px 16px;
  border-radius: 12px;
  background-color: #ffffff;
  color: #2d3748;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);

  font-family: "Twemoji Country Flags", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.message-wrapper.mine .bubble {
  background-color: #0077b6;
  color: #ffffff;
}

.text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

/* Input Area */
.input-container {
  flex-shrink: 0;
  padding: 16px 20px;
  background: #ffffff;
  border-top: 1px solid #edf2f7;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}

.input-form {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
}

.chat-input {
  width: 100%;
  padding: 12px 48px 12px 16px;
  border: 1.5px solid #0077b6;
  border-radius: 24px;
  outline: none;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  font-family: "Twemoji Country Flags", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.chat-input:focus {
  box-shadow: 0 0 0 3px rgba(0, 119, 182, 0.15);
}

/* Emoji Trigger Button inside input */
.emoji-wrapper {
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
}

.emoji-toggle-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: transform 0.15s ease;
}

.emoji-toggle-btn:hover {
  transform: scale(1.15);
}

/* Popover Picker */
.emoji-picker-popover {
  position: absolute;
  bottom: 48px;
  right: 0;
  z-index: 100;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  overflow: hidden;
  max-width: calc(100vw - 32px);
}

emoji-picker {
  width: 350px;
  max-width: 100%;
  height: 350px;

  --emoji-font-family: "Twemoji Country Flags", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", sans-serif;
}

@media (max-width: 480px) {
  .emoji-picker-popover {
    right: -64px;
  }
}

.send-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: none;
  background-color: #0077b6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.2s;
}

.send-btn:hover:not(:disabled) {
  background-color: #005f92;
  transform: scale(1.05);
}

.send-btn:disabled {
  background-color: #cbd5e0;
  cursor: not-allowed;
}

.send-icon {
  width: 18px;
  height: 18px;
  margin-left: 2px;
}

/* Animations */
.message-pop-enter-active {
  transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.message-pop-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>