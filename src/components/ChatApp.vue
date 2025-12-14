<template>
  <div class="chat-card">
    <div class="chat-header">AI Dungeon — Chat</div>

    <div class="chat-body" ref="chatBody">
      <div class="messages">
        <!-- Message wrapper -->
        <div
          v-for="(m, idx) in appState.history"
          :key="idx"
          class="message-wrapper"
          :class="m.role === 'user' ? 'wrapper-user' : 'wrapper-model'"
        >
          <!-- message bubble -->
          <div :class="['message', m.role === 'user' ? 'message-user' : 'message-model']">
            <div
              v-for="(part, partIdx) in m.parts"
              :key="partIdx"
              class="message-content"
              v-html="renderMarkdownToHtml(part.text)"
            ></div>
          </div>

          <!-- controls below bubble -->
          <div class="message-controls">
            <span
              class="material-symbols-outlined"
              title="Delete from here"
              @click="deleteFrom(idx)"
            >
              delete
            </span>

            <span
              v-if="m.role === 'model'"
              class="material-symbols-outlined"
              title="Regenerate"
              @click="regenerateFrom(idx)"
            >
              refresh
            </span>
          </div>
        </div>

        <div class="error" v-if="error">Error: {{ error }}</div>

        <div class="loading" v-if="isLoading">
          <div class="spinner"></div>
          Connecting...
        </div>
      </div>
    </div>

    <div class="chat-footer">
      <input
        v-model="input"
        @keydown.enter.prevent="sendMessage"
        type="text"
        class="chat-input"
        placeholder="Type a message and press Enter..."
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, toRaw } from 'vue';
import { ai, appState, RESPONSE_CONFIG } from '@/store';
import { renderMarkdownToHtml } from '@/utils';

let chat = null;

const chatBody = ref(null);
const input = ref('');

const isLoading = ref(false);
const error = ref(null);

onMounted(() => {
  console.log('Mounted ChatApp.vue');
  initChat();
  scrollToBottom();
});

async function initChat() {
  console.log('Initializing chat', {
    model: appState.value.selectedModel,
    systemInstruction: appState.value.systemInstruction,
    temperature: appState.value.temperature,
  });

  chat = ai.chats.create({
    model: toRaw(appState.value.selectedModel),
    config: {
      temperature: toRaw(appState.value.temperature),
      systemInstruction: toRaw(appState.value.systemInstruction),
    },
    history: toRaw(appState.value.history),
  });
}

async function sendMessage() {
  const payload = input.value.trim();
  if (!payload) return;
  input.value = '';

  appState.value.history.push({ role: 'user', parts: [{ text: payload }] });
  isLoading.value = true;
  error.value = null;
  scrollToBottom();

  try {
    const res = await chat.sendMessage({
      message: payload,
      config: RESPONSE_CONFIG,
    });

    const jsonOutput = JSON.parse(res.candidates[0].content.parts[0].text);

    appState.value.history.push({
      role: 'model',
      parts: [{ text: `<pre>${JSON.stringify(jsonOutput, null, 2)}</pre>` }], // pretty-print JSON in chat
    });

    console.log('sendMessage jsonOutput', jsonOutput);
    scrollToBottom();
  } catch (err) {
    error.value = err.message;
    console.error('sendMessage error', err);
  } finally {
    isLoading.value = false;
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight;
  });
}

// Delete messages starting from index
function deleteFrom(index) {
  appState.value.history = appState.value.history.slice(0, index);
  scrollToBottom();
}

// Regenerate an AI response starting from index
async function regenerateFrom(index) {
  const historyUpTo = appState.value.history.slice(0, index);
  appState.value.history = historyUpTo;

  const lastUser = [...historyUpTo].reverse().find(m => m.role === 'user');
  if (!lastUser) return;

  isLoading.value = true;
  error.value = null;
  scrollToBottom();

  try {
    const res = await chat.sendMessage({ message: lastUser.parts[0].text });
    appState.value.history.push({ role: 'model', parts: res.candidates[0].content.parts });
    console.log('regenerate res', res);
    scrollToBottom();
  } catch (err) {
    error.value = err.message;
    console.error('regenerate error', err);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.chat-card {
  display: flex;
  flex-direction: column;
  background: var(--color-surface-1);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-elevated);
}

.chat-header {
  padding: 0.75rem 1rem;
  font-weight: 600;
  background: var(--color-surface-2);
  border-bottom: 1px solid var(--color-border);
}

.chat-body {
  flex-grow: 1;
  padding: 1rem;
  overflow-y: auto;
}

.loading {
  margin: 0.5rem 0;
  display: flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--color-text-muted);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  margin: 0.5rem 0;
  color: var(--color-text-error);
  text-align: center;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* New wrapper styles */
.message-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 75%;
}

.wrapper-user {
  align-self: flex-end;
  text-align: right;
}

.wrapper-model {
  align-self: flex-start;
  text-align: left;
}

.message {
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  line-height: 1.4;
  word-wrap: break-word;
}

.message-model {
  background: var(--color-bubble-incoming-bg);
  color: var(--color-bubble-incoming-text);
}

.message-user {
  background: var(--color-bubble-outgoing-bg);
  color: var(--color-bubble-outgoing-text);
}

.message-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.message-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 1rem 0;
  opacity: 0.6;
}

.message-controls {
  display: flex;
  gap: 0.5rem;
  padding: 0 0.5rem;
  margin-top: 0.25rem;
  font-size: 1.1rem;
  color: var(--color-text-muted);
}

.wrapper-user .message-controls {
  justify-content: flex-end;
}

.wrapper-model .message-controls {
  justify-content: flex-start;
}

.message-controls .material-symbols-outlined {
  cursor: pointer;
  user-select: none;
}

.message-controls .material-symbols-outlined:hover {
  color: var(--color-text-main);
}

.chat-footer {
  padding: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.chat-input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  background: var(--color-surface-3);
  color: var(--color-text-main);
}

.chat-input::placeholder {
  color: var(--color-text-muted);
}
</style>
