import logging
import os
from pathlib import Path

import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from models.image import ImageStore
from api import feed, upload
from ws.hub import Hub

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="BoWatt API")

# CORS – allow all origins for development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared state.
store = ImageStore()
hub = Hub()

# Wire dependencies into route modules.
feed.init(store)
upload.init(store, hub, UPLOAD_DIR)

# Register REST routers.
app.include_router(feed.router)
app.include_router(upload.router)

# Serve uploaded images as static files.
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# WebSocket endpoint.
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await hub.connect(ws)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8081"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
