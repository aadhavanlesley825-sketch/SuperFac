import { useCallback, useState } from "react";
import { sendCommand } from "../lib/ai/aiService.js";

export function useAIChat({ welcomeText = "SuperFac Copilot is standing by. Issue a command and I'll act on your behalf." } = {}) {
  const [messages, setMessages] = useState([
    { role: "ai", text: welcomeText },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);

  const send = useCallback(async ({ input, context }) => {
    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage, { role: "ai", text: "", meta: { pending: true } }]);
    setIsTyping(true);
    setError(null);

    try {
      const finalText = await sendCommand({
        history: [...messages, userMessage],
        input,
        context,
        onUpdate: (partial) => {
          setMessages((prev) => {
            const next = [...prev];
            const lastIndex = next.length - 1;
            if (next[lastIndex]?.role === "ai") {
              next[lastIndex] = { ...next[lastIndex], text: partial, meta: { streaming: true } };
            }
            return next;
          });
        },
      });

      setMessages((prev) => {
        const next = [...prev];
        const lastIndex = next.length - 1;
        if (next[lastIndex]?.role === "ai") {
          next[lastIndex] = { role: "ai", text: finalText };
        }
        return next;
      });
    } catch (err) {
      setError(err.message || "AI service error.");
      setMessages((prev) => {
        const next = [...prev];
        const lastIndex = next.length - 1;
        if (next[lastIndex]?.role === "ai") {
          next[lastIndex] = { role: "ai", text: "I couldn't complete that request.", meta: { error: true } };
        }
        return next;
      });
    } finally {
      setIsTyping(false);
    }
  }, [messages]);

  const reset = useCallback(() => {
    setMessages([{ role: "ai", text: welcomeText }]);
    setError(null);
  }, [welcomeText]);

  return {
    messages,
    isTyping,
    error,
    send,
    reset,
  };
}
