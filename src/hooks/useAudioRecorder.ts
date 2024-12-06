/**
 * Custom hook for handling audio recording functionality
 * @module hooks/useAudioRecorder
 */

import { useState, useCallback, useRef } from "react";
import { useStore } from "../store/useStore";

interface UseAudioRecorderReturn {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  isRecording: boolean;
  error: string | null;
}

/**
 * Hook for managing audio recording state and functionality
 */
export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const { setAudioLevel } = useStore();

  /**
   * Analyzes audio data to update the audio level indicator
   */
  const analyzeAudio = useCallback(
    (audioContext: AudioContext, source: MediaStreamAudioSourceNode) => {
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (isRecording) {
          analyser.getByteFrequencyData(dataArray);
          const average =
            dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
          setAudioLevel((average / 256) * 100);
          requestAnimationFrame(updateLevel);
        }
      };

      updateLevel();
    },
    [isRecording, setAudioLevel],
  );

  /**
   * Starts the audio recording
   */
  const startRecording = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      analyzeAudio(audioContext, source);

      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError("Failed to start recording");
      console.error("Recording error:", err);
    }
  };

  /**
   * Stops the audio recording
   */
  const stopRecording = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorder.current) {
        reject(new Error("No media recorder"));
        return;
      }

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        resolve(audioBlob);
      };

      mediaRecorder.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
    });
  };

  return {
    startRecording,
    stopRecording,
    isRecording,
    error,
  };
};
