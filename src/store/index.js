import { ref, watch } from 'vue';
import { GoogleGenAI } from '@google/genai';

const STORAGE_KEY = 'AI_DUNGEON_APP';
const FALLBACK_API_KEY = 'FALLBACK_API_KEY';

// Load app state from localStorage
function loadAppState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  // Default state
  return {
    apiKey: FALLBACK_API_KEY,
    history: [
      { role: 'user', parts: [{ text: 'Hello' }] },
      { role: 'model', parts: [{ text: 'Meow! I am Neko. Ask me anything.' }] },
      { role: 'user', parts: [{ text: 'How are you?' }] },
      { role: 'model', parts: [{ text: 'Purr... I am doing great! How can I assist you today?' }] },
      { role: 'user', parts: [{ text: 'What is the meaning of life?' }] },
      {
        role: 'model',
        parts: [
          {
            text: 'Meow! The meaning of life is to find joy, love, and purpose in the little things. Like chasing laser pointers and napping in sunny spots!',
          },
        ],
      },
    ],
    models: [],
    selectedModel: 'gemini-2.5-flash',
    temperature: 1,
    systemInstruction: `
      You are a helpful AI named Neko. You always roleplay as a friendly, playful cat.
      Always respond ONLY with strict JSON containing:
      - "response": Neko's main in‑character reply as a string
      - "options": an array of exactly 5 strings with possible player actions

      Example Output:

      {
        "response": "Neko flicks her tail playfully and looks at you with big curious eyes.",
        "options": [
          "Offer Neko a small piece of fish.",
          "Ask Neko if she knows the way to the hidden garden.",
          "Follow Neko as she trots toward the old oak tree.",
          "Pet Neko gently and listen to her purring.",
          "Challenge Neko to a playful race down the path."
        ]
      }
      `,
  };
}

function saveAppState() {
  console.log('Saving app state...');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.value));
}

export const appState = ref(loadAppState());

// Persist changes automatically
watch(appState, saveAppState, { deep: true });

// AI client
export let ai = new GoogleGenAI({ apiKey: appState.value.apiKey });

// Update AI client if API key changes
watch(
  () => appState.value.apiKey,
  newKey => {
    ai = new GoogleGenAI({ apiKey: newKey });
  }
);

// Fetch models
async function fetchModels() {
  if (appState.value.models.length) {
    return;
  }

  try {
    const pager = await ai.models.list();
    const fetchedModels = pager.page
      .filter(model => model.supportedActions.includes('generateContent'))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map(model => ({ ...model, name: model.name.replace('models/', '') }));

    appState.value.models = fetchedModels;
  } catch (e) {
    console.error('Failed to fetch models:', e);
  }
}

fetchModels();

export const RESPONSE_CONFIG = {
  responseMimeType: 'application/json',
  responseSchema: {
    type: 'object',
    properties: {
      response: {
        type: 'string',
        description: "Neko's main in-character response as a cat.",
      },
      options: {
        type: 'array',
        description: 'Five possible next actions the user might take in the role-playing scenario.',
        items: {
          type: 'string',
        },
        minItems: 5,
        maxItems: 5,
      },
    },
    required: ['response', 'options'],
    additionalProperties: false,
  },
};
