import { useServices } from "@/context/ServiceContext";
import { useRef, useState } from "react";
import { useModelSelection } from "./useModelSelection";

const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

export const useAudioRecording = (
  onTranscriptionComplete: (text: string) => void,
) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState("00:00");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { whisperService } = useServices();
  const { selectedWhisperModel } = useModelSelection();

  const handleRecordingStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = ({ data }) => {
        if (data.size > 0) audioChunksRef.current.push(data);
      };

      mediaRecorder.onstart = () => setIsRecording(true);

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        await handleTranscription(audioBlob, selectedWhisperModel);
        stream.getTracks().forEach((track) => track.stop());
      };

      const startTime = Date.now();
      const timerInterval = setInterval(() => {
        setRecordingTime(formatTime(Date.now() - startTime));
      }, 1000);

      mediaRecorder.start(1000);

      return () => {
        clearInterval(timerInterval);
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      };
    } catch (error) {
      handleRecordingError(error);
    }
  };

  const handleRecordingStop = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime("00:00");
    }
  };

  const handleRecordingError = (error: unknown) => {
    console.error("Recording error:", error);
    setIsRecording(false);

    if (error instanceof DOMException) {
      switch (error.name) {
        case "NotAllowedError":
          alert(
            "Microphone access was denied. Please allow microphone access to use this feature.",
          );
          break;
        case "NotFoundError":
          alert(
            "No microphone was found. Please ensure you have a microphone connected.",
          );
          break;
        default:
          alert(
            "An error occurred while trying to start recording. Please check the console for details.",
          );
      }
    }
  };

  const handleTranscription = async (audioBlob: Blob, model: string) => {
    try {
      const text = await whisperService.transcribe(audioBlob, model);
      setIsLoading(true);
      if (text) onTranscriptionComplete(text);
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Failed to transcribe audio. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isRecording,
    recordingTime,
    isLoading,
    startRecording: handleRecordingStart,
    stopRecording: handleRecordingStop,
  };
};
