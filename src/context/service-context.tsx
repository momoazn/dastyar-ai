import { OllamaService } from "@/services/ollama";
import { StableDiffusionService } from "@/services/stable-diffusion";
import { WhisperService } from "@/services/whisper";
import { useChatSettings } from "@/hooks/use-chat-settings";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface ConnectionStatus {
  ollama: boolean;
  stableDiffusion: boolean;
  whisper: boolean;
}

export interface ServiceContextType {
  ollamaService: OllamaService;
  sdService: StableDiffusionService;
  whisperService: WhisperService;
  connectionsStatus: ConnectionStatus;
  ollamaModels: string[];
  whisperModels: string[];
}

const ServiceContext = createContext<ServiceContextType | null>(null);

export const useServices = () => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useServices must be used within a ServiceProvider");
  }
  return context;
};

export const ServiceProvider = ({ children }: PropsWithChildren) => {
  const ollamaService = useRef(new OllamaService());
  const sdService = useRef(new StableDiffusionService());
  const whisperService = useRef(new WhisperService());
  const { settings: chatSettings } = useChatSettings();

  const [connectionsStatus, setConnectionsStatus] = useState<ConnectionStatus>({
    ollama: false,
    stableDiffusion: false,
    whisper: false,
  });
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [whisperModels, setWhisperModels] = useState<string[]>([]);

  useEffect(() => {
    ollamaService.current.updateSettings(chatSettings);
  }, [chatSettings]);

  const checkAvailability = async () => {
    const [
      ollamaAvailable,
      sdAvailable,
      whisperAvailable,
      ollamaModels,
      whisperModels,
    ] = await Promise.all([
      ollamaService.current.checkAvailability(),
      sdService.current.checkAvailability(),
      whisperService.current.checkAvailability(),
      ollamaService.current.getModels(),
      whisperService.current.getModels(),
    ]);

    setConnectionsStatus({
      ollama: ollamaAvailable,
      stableDiffusion: sdAvailable,
      whisper: whisperAvailable,
    });
    setOllamaModels(ollamaModels);
    setWhisperModels(whisperModels);
  };

  useEffect(() => {
    checkAvailability();
  }, [setConnectionsStatus]);

  return (
    <ServiceContext.Provider
      value={{
        ollamaService: ollamaService.current,
        sdService: sdService.current,
        whisperService: whisperService.current,
        connectionsStatus,
        ollamaModels,
        whisperModels,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};
