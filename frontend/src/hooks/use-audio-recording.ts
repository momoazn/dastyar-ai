import { useState } from "react";

export const useAudioRecording = (
  onTranscriptionComplete: (text: string) => void,
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState("00:00");
  const [isLoading, setIsLoading] = useState(false);

  const handleRecordingStart = async () => {
    // Audio transcription is not implemented in this version
    console.log("Audio recording is not available in this version");
    return () => {};
  };

  const handleRecordingStop = () => {
    // Audio transcription is not implemented in this version
    console.log("Audio recording is not available in this version");
  };

  return {
    isRecording: false, // Always disabled
    recordingTime,
    isLoading: false,
    startRecording: handleRecordingStart,
    stopRecording: handleRecordingStop,
  };
};
