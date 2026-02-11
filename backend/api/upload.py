from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from PIL import Image as PILImage

from models.image import Image, ImageStore
from ws.hub import Hub

router = APIRouter()

TARGET_SIZE = 512
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

store: ImageStore | None = None
hub: Hub | None = None
upload_dir: Path = Path("uploads")


def init(image_store: ImageStore, ws_hub: Hub, uploads: Path) -> None:
    global store, hub, upload_dir
    store = image_store
    hub = ws_hub
    upload_dir = uploads


@router.post("/api/upload", status_code=201)
async def upload_image(
    title: str = Form(...),
    tags: str = Form(default=""),
    image: UploadFile = File(...),
):
    assert store is not None and hub is not None

    if not title.strip():
        raise HTTPException(status_code=400, detail="title is required")

    content_type = image.content_type or ""
    if content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(
            status_code=400, detail="only JPEG and PNG images are accepted"
        )

    data = await image.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="file too large (max 10 MB)")

    # Decode, crop square, resize to 512x512.
    try:
        import io

        pil_img = PILImage.open(io.BytesIO(data))
        pil_img = _crop_square(pil_img)
        pil_img = pil_img.resize((TARGET_SIZE, TARGET_SIZE), PILImage.LANCZOS)
    except Exception:
        raise HTTPException(status_code=400, detail="failed to process image")

    img_id = str(uuid.uuid4())
    ext = ".png" if content_type == "image/png" else ".jpg"
    filename = f"{img_id}{ext}"
    out_path = upload_dir / filename

    fmt = "PNG" if ext == ".png" else "JPEG"
    save_kwargs = {} if fmt == "PNG" else {"quality": 85}
    pil_img.save(str(out_path), format=fmt, **save_kwargs)

    parsed_tags = [t.strip() for t in tags.split(",") if t.strip()]

    img = Image(
        id=img_id,
        title=title.strip(),
        tags=parsed_tags,
        filename=filename,
        url=f"/uploads/{filename}",
    )
    store.add(img)

    await hub.broadcast({"type": "new_image", "image": img.to_dict()})

    return img.to_dict()


def _crop_square(img: PILImage.Image) -> PILImage.Image:
    """Center-crop to the largest square."""
    w, h = img.size
    size = min(w, h)
    left = (w - size) // 2
    top = (h - size) // 2
    return img.crop((left, top, left + size, top + size))
