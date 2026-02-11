const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8081";
const WS_BASE = import.meta.env.VITE_WS_URL || "ws://localhost:8081";

export const API = {
  feed: (offset: number, limit: number) =>
    `${API_BASE}/api/feed?offset=${offset}&limit=${limit}`,
  upload: `${API_BASE}/api/upload`,
  ws: `${WS_BASE}/ws`,
  imageUrl: (path: string) => `${API_BASE}${path}`,
};
