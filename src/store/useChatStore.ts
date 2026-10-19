import { create } from 'zustand';
import { AiChatMessage, sendAiTriageMessage } from '../services/nvidiaAiService';

interface ChatState {
  messages: AiChatMessage[];
  isLoading: boolean;
  quickPrompts: string[];

  // Actions
  sendMessage: (text: string, userLat: number, userLng: number) => Promise<void>;
  resetChat: () => void;
}

const INITIAL_MESSAGES: AiChatMessage[] = [
  {
    id: 'ai-welcome',
    sender: 'assistant',
    text: "Hi, I'm **SavLife AI**. Tell me what's happening or what symptoms you're experiencing, and I'll provide immediate first-aid triage and find emergency care nearby.",
    timestamp: 'Just now',
  },
];

export const useChatStore = create<ChatState>((set, get) => ({
  messages: INITIAL_MESSAGES,
  isLoading: false,
  quickPrompts: [
    '🫀 Severe Chest Pain',
    '🩸 Road Accident & Bleeding',
    '🏥 Nearest ICU Hospital',
    '🫁 Breathing Difficulty',
    '🔥 Burn Injury Care',
  ],

  sendMessage: async (text: string, userLat: number, userLng: number) => {
    if (!text.trim()) return;

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
    }));

    try {
      const history = get().messages.map((m) => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));

      const aiResponse = await sendAiTriageMessage(text, userLat, userLng, history);

      set((state) => ({
        messages: [...state.messages, aiResponse],
        isLoading: false,
      }));
    } catch (err) {
      console.warn('Chat send error:', err);
      const fallbackMsg: AiChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        text: 'I am immediately locating the nearest emergency hospitals with open trauma centers for your location.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      set((state) => ({
        messages: [...state.messages, fallbackMsg],
        isLoading: false,
      }));
    }
  },

  resetChat: () => set({ messages: INITIAL_MESSAGES, isLoading: false }),
}));
