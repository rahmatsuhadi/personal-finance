export interface AiConfig {
  apiKey: string;
  enabled: boolean;
}

const STORAGE_KEYS = {
  API_KEY: "kanti_ai_api_key",
  ENABLED: "kanti_ai_enabled",
};

export const DEFAULT_AI_CONFIG: AiConfig = {
  apiKey: "",
  enabled: false,
};

// Ambil URL backend dari env Vite atau fallback lokal
export function getBackendApiUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  return (envUrl || "http://localhost:5000").replace(/\/+$/, "");
}

// Ambil konfigurasi AI dari localStorage
export function getAiConfig(): AiConfig {
  const savedKey = localStorage.getItem(STORAGE_KEYS.API_KEY) ?? DEFAULT_AI_CONFIG.apiKey;
  const savedEnabled = localStorage.getItem(STORAGE_KEYS.ENABLED);
  const isEnabled = savedEnabled !== null ? savedEnabled === "true" : Boolean(savedKey.trim());

  return {
    apiKey: savedKey,
    enabled: isEnabled,
  };
}

// Simpan konfigurasi AI ke localStorage
export function saveAiConfig(config: Partial<AiConfig>): void {
  if (config.apiKey !== undefined) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, config.apiKey.trim());
  }
  if (config.enabled !== undefined) {
    localStorage.setItem(STORAGE_KEYS.ENABLED, String(config.enabled));
  }
}

export interface ChatHistoryItem {
  role: "user" | "assistant" | "ai";
  content: string;
}

export interface ChatRequestPayload {
  message: string;
  userName?: string;
  financialContext?: Record<string, unknown>;
  history?: ChatHistoryItem[];
}

export interface ChatResponsePayload {
  text: string;
  metadata?: {
    type: "transaction_confirmation";
    data: {
      type: "income" | "expense" | "transfer";
      amount: number;
      description: string;
      category?: string;
      walletName?: string;
    };
    isApproved: boolean;
  };
}

// Panggil backend API /api/chat dengan proteksi x-api-key
export async function sendBackendChat(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
  const config = getAiConfig();
  if (!config.enabled || !config.apiKey.trim()) {
    throw new Error("Integrasi AI dinonaktifkan atau API Key belum diset.");
  }

  const backendUrl = getBackendApiUrl();
  const res = await fetch(`${backendUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey.trim(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    let msg = `Gagal menghubungi AI Server (${res.status} ${res.statusText})`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error) msg = parsed.error;
      else if (parsed.text) msg = parsed.text;
    } catch {
      if (errorText) msg += `: ${errorText.slice(0, 100)}`;
    }
    throw new Error(msg);
  }

  return (await res.json()) as ChatResponsePayload;
}

export interface ScanReceiptRequest {
  image: string;
  categories?: string;
  date?: string;
}

export interface ScanReceiptResponse {
  success: boolean;
  data?: {
    type: "income" | "expense" | "transfer";
    amount: number;
    description: string;
    category: string;
    date: string;
    useItemDetails?: boolean;
    items?: Array<{ name: string; price: number }>;
  };
  error?: string;
}

// Panggil backend API /api/scan dengan proteksi x-api-key
export async function scanReceiptWithBackend(payload: ScanReceiptRequest): Promise<ScanReceiptResponse> {
  const config = getAiConfig();
  if (!config.enabled || !config.apiKey.trim()) {
    throw new Error("Fitur scanner memerlukan API Key aktif di Pengaturan.");
  }

  const backendUrl = getBackendApiUrl();
  const res = await fetch(`${backendUrl}/api/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey.trim(),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    let msg = `Gagal memindai nota (${res.status} ${res.statusText})`;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.error) msg = parsed.error;
    } catch {
      if (errorText) msg += `: ${errorText.slice(0, 100)}`;
    }
    throw new Error(msg);
  }

  return (await res.json()) as ScanReceiptResponse;
}
