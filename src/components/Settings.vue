<template>
  <div class="settings-card">
    <h1>Settings</h1>
    <div class="settings-form">
      <div class="form-group">
        <label for="api-key">API Key</label>
        <input type="text" v-model="appState.apiKey" id="api-key" />
      </div>

      <div class="form-group">
        <label for="model">Model</label>
        <select v-model="appState.selectedModel" id="model">
          <option v-for="model in appState.models" :key="model.name" :value="model.name">
            {{ model.displayName }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="system">System Instructions</label>
        <textarea v-model="appState.systemInstruction" id="system" rows="4"></textarea>
      </div>

      <div class="form-group">
        <label for="temperature">Temperature: {{ appState.temperature }}</label>
        <input
          type="range"
          v-model="appState.temperature"
          id="temperature"
          min="0"
          max="2"
          step="0.1"
        />
      </div>

      <div class="form-group">
        <button @click="resetAppState">Reset App</button>
        <button @click="clearHistory">Clear History</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { appState } from '@/store';

function resetAppState() {
  if (confirm('Are you sure you want to reset the app?')) {
    localStorage.removeItem('AI_DUNGEON_APP');
    location.reload();
  }
}

function clearHistory() {
  if (confirm('Clear chat history?')) {
    appState.value.history = [];
  }
}
</script>

<style scoped>
.settings-card {
  padding: 1rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 500px;
  overflow-y: auto;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

select,
textarea,
input {
  padding: 0.5rem;
  border: 1px solid var(--color-input-border);
  border-radius: 4px;
}

textarea {
  resize: vertical;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #3b82f6;
  color: white;
  cursor: pointer;
}

button:hover {
  background-color: #2563eb;
}
</style>
