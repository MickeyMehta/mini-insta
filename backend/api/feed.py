from fastapi import APIRouter, Query

from models.image import ImageStore

router = APIRouter()

# Will be set from main.py.
store: ImageStore | None = None


def init(image_store: ImageStore) -> None:
    global store
    store = image_store


@router.get("/api/feed")
async def get_feed(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=50),
):
    assert store is not None
    images, total = store.list(offset, limit)
    return {
        "images": [img.to_dict() for img in images],
        "total": total,
        "offset": offset,
        "limit": limit,
    }
