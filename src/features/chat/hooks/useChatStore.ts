import { create } from "zustand";

interface ChatStore {
  // セッションID管理
  localSessionId: string | undefined;
  setLocalSessionId: (id: string | undefined) => void;

  // 入力状態
  input: string;
  setInput: (value: string) => void;

  // Redo状態
  redoingHistoryId: string | null;
  setRedoingHistoryId: (id: string | null) => void;

  // リセット
  resetForNewSession: () => void;
  resetForSessionSwitch: (newSessionId: string) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  localSessionId: undefined,
  setLocalSessionId: (id) => set({ localSessionId: id }),

  input: "",
  setInput: (value) => set({ input: value }),

  redoingHistoryId: null,
  setRedoingHistoryId: (id) => set({ redoingHistoryId: id }),

  resetForNewSession: () =>
    set({
      localSessionId: undefined,
      input: "",
      redoingHistoryId: null,
    }),

  resetForSessionSwitch: (newSessionId) =>
    set({
      localSessionId: newSessionId,
      input: "",
      redoingHistoryId: null,
    }),
}));
