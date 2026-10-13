import { getAiConfig, getBackendApiUrl } from "@/lib/aiConfig";
import { executeQueryFinancialData, executeGetBudgetStatus } from "./clientTools";

export interface ToolCallItem {
  id: string;
  name: string;
  arguments: string;
}

export interface StreamEventCallbacks {
  onDelta?: (textChunk: string) => void;
  onToolCall?: (toolCall: ToolCallItem) => void;
}

export interface StreamChatPayload {
  message?: string;
  userName?: string;
  financialContext?: Record<string, unknown>;
  history?: Array<{
    role: string;
    content?: string | null;
    tool_calls?: any[];
    tool_call_id?: string;
  }>;
}

// Eksekusi tool call lokal secara otomatis jika AI butuh query data
async function handleLocalToolExecution(toolCall: ToolCallItem): Promise<string> {
  try {
    const args = toolCall.arguments ? JSON.parse(toolCall.arguments) : {};
    if (toolCall.name === "queryFinancialData") {
      const res = await executeQueryFinancialData(args);
      return JSON.stringify(res);
    }
    if (toolCall.name === "getBudgetStatus") {
      const res = await executeGetBudgetStatus(args);
      return JSON.stringify(res);
    }
  } catch (err) {
    return JSON.stringify({ error: String(err) });
  }
  return JSON.stringify({ status: "acknowledged" });
}

// Stream reader native SSE bawaan browser dengan penanganan round-trip tool calls
export async function streamBackendChat(
  payload: StreamChatPayload,
  callbacks: StreamEventCallbacks
): Promise<{ text: string; toolCalls: ToolCallItem[] }> {
  const config = getAiConfig();
  if (!config.enabled || !config.apiKey.trim()) {
    throw new Error("Integrasi AI dinonaktifkan atau API Key belum diset.");
  }

  const backendUrl = getBackendApiUrl();
  const currentHistory = [...(payload.history || [])];

  const requestBody = {
    ...payload,
    stream: true,
    history: currentHistory,
  };

  const res = await fetch(`${backendUrl}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "x-api-key": config.apiKey.trim(),
    },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Gagal menghubungi AI Server (${res.status}): ${errorText.slice(0, 100)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Browser tidak mendukung stream reader.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let accumulatedText = "";
  const detectedToolCalls: ToolCallItem[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      const lines = part.split("\n");
      let eventType = "message";
      let eventData = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventType = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          eventData = line.slice(5).trim();
        }
      }

      if (eventType === "text_delta" && eventData) {
        try {
          const parsed = JSON.parse(eventData);
          if (parsed.text) {
            accumulatedText += parsed.text;
            callbacks.onDelta?.(parsed.text);
          }
        } catch {
          // Abaikan json parse error
        }
      } else if (eventType === "tool_call" && eventData) {
        try {
          const parsed: ToolCallItem = JSON.parse(eventData);
          detectedToolCalls.push(parsed);
          callbacks.onToolCall?.(parsed);
        } catch {
          // Abaikan json parse error
        }
      }
    }
  }

  // Cek apakah ada data querying tool call yang butuh round-trip ke AI
  const queryTool = detectedToolCalls.find(
    (tc) => tc.name === "queryFinancialData" || tc.name === "getBudgetStatus"
  );

  if (queryTool) {
    // Eksekusi query Dexie lokal
    const toolResultString = await handleLocalToolExecution(queryTool);

    // Siapkan history untuk round-trip kedua
    const nextHistory = [...currentHistory];
    if (payload.message) {
      nextHistory.push({ role: "user", content: payload.message });
    }
    nextHistory.push({
      role: "assistant",
      content: accumulatedText || null,
      tool_calls: [
        {
          id: queryTool.id,
          type: "function",
          function: { name: queryTool.name, arguments: queryTool.arguments },
        },
      ],
    });
    nextHistory.push({
      role: "tool",
      tool_call_id: queryTool.id,
      content: toolResultString,
    });

    // Panggil stream kedua untuk sintesis jawaban akhir
    return streamBackendChat(
      {
        userName: payload.userName,
        financialContext: payload.financialContext,
        history: nextHistory,
      },
      callbacks
    );
  }

  return {
    text: accumulatedText,
    toolCalls: detectedToolCalls,
  };
}
