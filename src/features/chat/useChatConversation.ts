import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage, MedicalChartResponse, FileUpload } from "../../types";
import { sendChatMessage } from "../../services/ai/actions";
import { sendNotification } from "../../services/notificationService";
import {
  createAssistantChatMessage,
  createChatErrorMessage,
  getChatRetryContext,
} from "./messages";

interface UseChatConversationOptions {
  chartData: MedicalChartResponse | null;
  isOpen: boolean;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "AbortError"
  );
}

export function useChatConversation({
  chartData,
  isOpen,
}: UseChatConversationOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatRequestId = useRef(0);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((previous) => [...previous, message]);
  }, []);

  const requestReply = useCallback(
    async (history: ChatMessage[], userMessage: ChatMessage) => {
      const requestId = Date.now();
      chatRequestId.current = requestId;
      setIsLoading(true);

      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const reply = await sendChatMessage(
          history,
          userMessage.text,
          chartData,
          true,
          abortController.signal,
          userMessage.attachments,
        );

        if (chatRequestId.current === requestId) {
          setMessages((previous) => [
            ...previous,
            createAssistantChatMessage(reply),
          ]);
          if (!isOpen || document.visibilityState === "hidden") {
            sendNotification("New Message from Clinical Assistant", {
              body:
                reply.text.substring(0, 100) +
                (reply.text.length > 100 ? "..." : ""),
              tag: "chat-response",
            });
          }
        }
      } catch (error) {
        if (chatRequestId.current === requestId && !isAbortError(error)) {
          setMessages((previous) => [...previous, createChatErrorMessage()]);
        }
      } finally {
        if (chatRequestId.current === requestId) {
          setIsLoading(false);
          abortControllerRef.current = null;
        }
      }
    },
    [chartData, isOpen],
  );

  const sendMessage = useCallback(
    async (text: string, attachments: FileUpload[]) => {
      if ((!text.trim() && attachments.length === 0) || isLoading) return;
      const userMessage: ChatMessage = {
        role: "user",
        text,
        attachments: attachments.length ? [...attachments] : undefined,
      };
      setMessages((previous) => [...previous, userMessage]);
      await requestReply(messages, userMessage);
    },
    [isLoading, messages, requestReply],
  );

  const retryMessage = useCallback(
    async (errorMessageIndex: number) => {
      if (isLoading) return;
      const retryContext = getChatRetryContext(messages, errorMessageIndex);
      if (!retryContext) return;

      setMessages((previous) =>
        previous.filter((_, index) => index !== errorMessageIndex),
      );
      await requestReply(retryContext.history, retryContext.userMessage);
    },
    [isLoading, messages, requestReply],
  );

  const cancel = useCallback(() => {
    chatRequestId.current = 0;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  return { messages, isLoading, addMessage, sendMessage, retryMessage, cancel };
}
