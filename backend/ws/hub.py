from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class Hub:
    """Manages active WebSocket connections and broadcasts messages."""

    def __init__(self) -> None:
        self._clients: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._clients.add(ws)
        logger.info("ws client connected (%d total)", len(self._clients))

        try:
            # Keep alive; wait for client to disconnect.
            while True:
                await ws.receive_text()
        except WebSocketDisconnect:
            pass
        finally:
            async with self._lock:
                self._clients.discard(ws)
            logger.info("ws client disconnected (%d total)", len(self._clients))

    async def broadcast(self, msg: Any) -> None:
        payload = json.dumps(msg)
        async with self._lock:
            stale: list[WebSocket] = []
            for ws in self._clients:
                try:
                    await ws.send_text(payload)
                except Exception:
                    stale.append(ws)
            for ws in stale:
                self._clients.discard(ws)
