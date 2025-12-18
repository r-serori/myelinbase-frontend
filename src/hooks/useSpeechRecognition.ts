import { useState, useEffect, useRef, useCallback } from "react";

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export function useSpeechRecognition() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  // セッション中の認識テキスト（確定＋未確定）
  const [transcript, setTranscript] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const win = window as unknown as Window;
    const SpeechRecognition =
      win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "ja-JP"; // 日本語固定
      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    setTranscript("");
    try {
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Speech recognition start failed", e);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.error("Speech recognition stop failed", e);
    }
    // onendでfalseになるが、即時反映のためここでも呼ぶ
    setIsRecording(false);
  }, []);

  useEffect(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript;
      }
      // continuous: true の場合、event.resultsには過去の分も蓄積されるが、
      // resultIndex 以降を見ることで差分取得も可能。
      // しかし、簡単なのは全結合テキストを取得すること。
      // ただし、AndroidのChromeなどでは挙動が怪しいことがある。
      // ここではシンプルに「今回のセッションで認識された全テキスト」を再構築する。

      let fullTranscript = "";
      for (let i = 0; i < event.results.length; ++i) {
        fullTranscript += event.results[i][0].transcript;
      }
      setTranscript(fullTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      // エラー時は停止
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    // クリーンアップは特にしない（refで保持し続ける）
  }, []);

  return {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    isSupported,
  };
}
