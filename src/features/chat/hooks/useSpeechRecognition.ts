import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { useToast } from "@/providers/ToastProvider";

// SpeechRecognition API の型定義
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error:
    | "no-speech"
    | "aborted"
    | "audio-capture"
    | "network"
    | "not-allowed"
    | "service-not-allowed"
    | "bad-grammar"
    | "language-not-supported";
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface WindowWithSpeech {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

type UseSpeechRecognitionOptions = {
  onTranscript?: (text: string) => void;
};

// SpeechRecognition APIのサポート確認
function getIsSupported(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as unknown as WindowWithSpeech;
  return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
}

// SSR対応のサポート確認
function useIsSupported(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => getIsSupported(),
    () => false
  );
}

export function useSpeechRecognition(options?: UseSpeechRecognitionOptions) {
  const { showToast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const isSupported = useIsSupported();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const optionsRef = useRef(options);

  // optionsを最新に保つ
  useEffect(() => {
    optionsRef.current = options;
  });

  // SpeechRecognitionインスタンスの初期化
  useEffect(() => {
    if (!isSupported) return;

    const win = window as unknown as WindowWithSpeech;
    const SpeechRecognition =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ja-JP";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; ++i) {
        fullTranscript += event.results[i][0].transcript;
      }
      optionsRef.current?.onTranscript?.(fullTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported]);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch {
      showToast({
        type: "error",
        message: "音声入力の開始に失敗しました。再度お試しください。",
      });
    }
  }, [showToast]);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      showToast({
        type: "error",
        message: "音声入力の停止に失敗しました。再度お試しください。",
      });
    }
    setIsRecording(false);
  }, [showToast]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    isSupported,
  };
}
