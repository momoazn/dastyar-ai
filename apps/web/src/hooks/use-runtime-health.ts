import { useQuery } from "@tanstack/react-query";

export type RuntimeHealth = {
  status: string;
  whisper: {
    available: boolean;
    status: number;
  };
};

const fetchRuntimeHealth = async (): Promise<RuntimeHealth> => {
  const response = await fetch("/health", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("بررسی سلامت سرویس ناموفق بود.");
  }
  return (await response.json()) as RuntimeHealth;
};

/** Server and whisper status from `/health`, refreshed every 30 seconds. */
export function useRuntimeHealth() {
  return useQuery({
    queryKey: ["runtime-health"],
    queryFn: fetchRuntimeHealth,
    refetchInterval: 30_000,
    meta: { suppressErrorToast: true },
  });
}

/**
 * False only when the server says whisper is down.
 * Unknown (loading or failed check) counts as available, so the UI does not flicker.
 */
export function useWhisperAvailable(): boolean {
  const { data } = useRuntimeHealth();
  return data?.whisper.available ?? true;
}
