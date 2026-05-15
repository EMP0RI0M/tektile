import { createAnthropic } from "@ai-sdk/anthropic";
import {
  createOpenAI,
  type OpenAIResponsesProviderOptions,
} from "@ai-sdk/openai";
import {
  stepCountIs,
  streamText,
  type UIMessage,
  type ToolSet,
  convertToModelMessages,
} from "ai";

type LlmProviderName = "openai" | "anthropic" | "openrouter";

const getProviderName = (override?: string): LlmProviderName => {
  const value = (override ?? process.env["LLM_PROVIDER"])?.toLowerCase()?.trim();
  if (value === "anthropic" || value === "claude") return "anthropic";
  if (value === "openrouter") return "openrouter";
  
  // Auto-detect: If OpenAI key is missing but OpenRouter is present, default to OpenRouter
  if (!process.env.OPENAI_API_KEY && process.env.OPENROUTER_API_KEY) {
    return "openrouter";
  }

  return "openai";
};

type StreamLlmResponseParams = {
  system: string;
  messages: UIMessage[];
  tools: ToolSet;
  apiKey?: string;
  providerOverride?: string;
};

type StreamLlmResponseResult = {
  result: ReturnType<typeof streamText>;
  provider: LlmProviderName;
};

export const streamLlmResponse = async ({
  system,
  messages,
  tools,
  apiKey,
  providerOverride,
}: StreamLlmResponseParams): Promise<StreamLlmResponseResult> => {
  const provider = getProviderName(providerOverride);
  
  // Safety guard and normalization for messages
  const safeMessages = (Array.isArray(messages) ? messages : [])
    .filter(m => m !== null && typeof m === 'object')
    .map(m => {
      let content = m.content;
      
      // If content is empty/missing, try to extract from 'parts' (common in some SDK versions)
      if (!content && Array.isArray((m as any).parts)) {
        content = (m as any).parts
          .filter((p: any) => p && p.type === 'text')
          .map((p: any) => p.text || "")
          .join('\n');
      }
      
      // Final fallback to ensure content is always a string
      if (typeof content !== 'string') {
        content = content ? String(content) : "";
      }
      
      return {
        ...m,
        content: content,
        role: m.role || 'user',
        createdAt: m.createdAt || new Date(),
      };
    });
  
  // Debug logging for messages
  console.log(`[LLM Provider] Processing ${safeMessages.length} messages`);
  if (safeMessages.length > 0) {
    console.log(`[LLM Provider] Last message role: ${safeMessages[safeMessages.length-1].role}`);
  }

  // Manual conversion to CoreMessage to avoid SDK utility crashes
  const modelMessages = safeMessages.map(m => {
    const role = m.role?.toLowerCase();
    return {
      role: (role === 'assistant' || role === 'user' || role === 'system' || role === 'tool') 
        ? role 
        : 'user',
      content: m.content || '',
    };
  });

  if (provider === "openrouter") {
    const orApiKey = apiKey || process.env.OPENROUTER_API_KEY;
    const openrouter = createOpenAI({
      apiKey: orApiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });

    let modelName = process.env.DEFAULT_AI_MODEL || "google/gemini-2.0-flash-001";
    if (modelName.includes("hy3-preview:free")) {
      modelName = "deepseek/deepseek-v3:free"; // Redirect to DeepSeek if hy3 is still in env
    }

    const result = streamText({
      system,
      model: openrouter.chat(modelName),
      messages: modelMessages as any,
      tools,
      maxRetries: 5,
      stopWhen: stepCountIs(100),
    });

    return { result, provider };
  }

  if (provider === "openai") {
    const openaiProvider = apiKey ? createOpenAI({ apiKey }) : createOpenAI({});
    const result = streamText({
      system,
      model: openaiProvider.responses("gpt-4o"),
      messages: modelMessages as any,
      tools,
      providerOptions: {
        openai: {
          reasoningEffort: "low",
        } satisfies OpenAIResponsesProviderOptions,
      },
      stopWhen: stepCountIs(100),
    });

    return {
      result,
      provider,
    };
  }

  const anthropicProvider = apiKey
    ? createAnthropic({ apiKey })
    : createAnthropic({});
  const result = streamText({
    system,
    model: anthropicProvider("claude-3-5-sonnet-20240620"),
    messages: modelMessages as any,
    tools,
    stopWhen: stepCountIs(100),
  });

  return {
    result,
    provider,
  };
};
