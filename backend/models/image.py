from __future__ import annotations

import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class Image:
    id: str
    title: str
    tags: list[str]
    filename: str
    url: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "tags": self.tags,
            "filename": self.filename,
            "url": self.url,
            "created_at": self.created_at.isoformat(),
        }


class ImageStore:
    """Thread-safe in-memory store for images, newest first."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._images: list[Image] = []

    def add(self, img: Image) -> None:
        with self._lock:
            self._images.insert(0, img)

    def list(self, offset: int, limit: int) -> tuple[list[Image], int]:
        with self._lock:
            total = len(self._images)
            if offset >= total:
                return [], total
            end = min(offset + limit, total)
            return list(self._images[offset:end]), total
