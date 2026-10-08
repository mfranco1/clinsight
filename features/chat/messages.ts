import { ChatMessage } from "../../types";
import { sendChatMessage } from "../../services/ai/actions";

export type ChatReply = Awaited<ReturnType<typeof sendChatMessage>>;

export function createAssistantChatMessage(reply: ChatReply): ChatMessage {
  return {
    role: "model",
    text: reply.text,
    groundingSources: reply.groundingSources,
    title: reply.title || "Clinical Conversation",
  };
}

export function createChatErrorMessage(): ChatMessage {
  return {
    role: "model",
    text: "Sorry, I encountered an error processing your request.",
    isError: true,
  };
}

export function getChatRetryContext(
  messages: ChatMessage[],
  errorMessageIndex: number,
): {
  userMessage: ChatMessage;
  history: ChatMessage[];
} | null {
  let userMessageIndex = -1;
  for (let index = errorMessageIndex - 1; index >= 0; index--) {
    if (messages[index].role === "user") {
      userMessageIndex = index;
      break;
    }
  }

  if (userMessageIndex === -1) return null;

  return {
    userMessage: messages[userMessageIndex],
    history: messages.slice(0, userMessageIndex),
  };
}
