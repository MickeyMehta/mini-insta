import { useEffect, useRef, useCallback } from "react";
import { API } from "../api";
import type { ImageData } from "../types";

interface WSMessage {
  type: string;
  image: ImageData;
}

export function useWebSocket(onNewImage: (img: ImageData) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const callbackRef = useRef(onNewImage);
  callbackRef.current = onNewImage;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(API.ws);

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        if (data.type === "new_image" && data.image) {
          callbackRef.current(data.image);
        }
      } catch {
        // Ignore malformed messages.
      }
    };

    ws.onclose = () => {
      // Reconnect after a delay.
      setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);
}
