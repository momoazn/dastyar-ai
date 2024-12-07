import { useRef, useState } from 'react';

const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

export const useAudioRecording = (onTranscriptionComplete: (text: string) => void) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState("00:00");
  const [isRecording, setIsRecording] = useState(false);

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
        await handleTranscription(audioBlob);
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
            "Microphone access was denied. Please allow microphone access to use this feature."
          );
          break;
        case "NotFoundError":
          alert(
            "No microphone was found. Please ensure you have a microphone connected."
          );
          break;
        default:
          alert(
            "An error occurred while trying to start recording. Please check the console for details."
          );
      }
    }
  };

  const handleTranscription = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.wav");

      const response = await fetch("http://localhost:8000/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          `Transcription failed: ${response.status} ${errorData?.detail || ""}`
        );
      }

      const { text } = await response.json();
      if (text) onTranscriptionComplete(text);
    } catch (error) {
      console.error("Transcription error:", error);
      alert("Failed to transcribe audio. Please try again.");
    }
  };

  return {
    isRecording,
    recordingTime,
    startRecording: handleRecordingStart,
    stopRecording: handleRecordingStop,
  };
};
