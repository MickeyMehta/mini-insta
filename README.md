# Mini Insta

A full-stack anonymous image sharing platform with real-time feed updates. Users can upload images with titles and tags, and all connected clients see new uploads instantly via WebSocket broadcasting.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [WebSocket Protocol](#websocket-protocol)
- [Image Processing](#image-processing)
- [Frontend Details](#frontend-details)
- [Backend Details](#backend-details)
- [Known Limitations](#known-limitations)

## Features

- **Anonymous Image Upload** -- No registration required. Upload JPEG/PNG images (up to 10 MB) with a title and optional comma-separated tags.
- **Real-Time Feed** -- WebSocket-powered live updates push new images to all connected clients instantly.
- **Infinite Scroll** -- Paginated feed with automatic loading as you scroll, using the IntersectionObserver API.
- **Fuzzy Tag Search** -- Filter images by tags with fuzzy matching powered by Fuse.js.
- **Drag & Drop Upload** -- Drag images directly onto the upload form, with file preview before submitting.
- **Automatic Image Processing** -- Uploaded images are center-cropped to square and resized to 512x512 pixels.
- **Responsive Design** -- Two-column desktop layout collapses to a single-column stack on mobile (breakpoint at 768px).

## Tech Stack

| Layer    | Technology                          |
| -------- | ----------------------------------- |
| Frontend | React 19, TypeScript, Vite          |
| Backend  | FastAPI, Uvicorn, Python 3.12+      |
| Realtime | WebSockets (native + `websockets`)  |
| Search   | Fuse.js (client-side fuzzy search)  |
| Imaging  | Pillow (server-side processing)     |
| Storage  | Filesystem (uploads/) + In-memory   |
| Styling  | Plain CSS with CSS custom properties|

## Architecture

```
┌─────────────────────────┐         ┌─────────────────────────────┐
│       Frontend          │         │          Backend            │
│    (React + Vite)       │         │         (FastAPI)           │
│                         │         │                             │
│  ┌───────────────────┐  │  HTTP   │  ┌───────────┐             │
│  │   UploadForm      │──┼────────►│  │ POST      │             │
│  │   (drag & drop)   │  │         │  │ /api/upload│             │
│  └───────────────────┘  │         │  └─────┬─────┘             │
│                         │         │        │                    │
│  ┌───────────────────┐  │  HTTP   │  ┌─────▼─────┐             │
│  │   Feed            │──┼────────►│  │ GET       │             │
│  │   (infinite scroll)│  │         │  │ /api/feed │             │
│  └───────────────────┘  │         │  └───────────┘             │
│                         │         │                             │
│  ┌───────────────────┐  │   WS    │  ┌───────────┐             │
│  │   useWebSocket    │◄─┼────────►│  │ Hub       │             │
│  │   (hook)          │  │         │  │ /ws       │             │
│  └───────────────────┘  │         │  └───────────┘             │
│                         │         │                             │
│  ┌───────────────────┐  │         │  ┌───────────────────────┐  │
│  │   ImageCard       │  │         │  │ ImageStore (in-memory)│  │
│  └───────────────────┘  │         │  └───────────────────────┘  │
│                         │         │                             │
│  ┌───────────────────┐  │         │  ┌───────────────────────┐  │
│  │   Fuse.js filter  │  │         │  │ uploads/ (filesystem) │  │
│  └───────────────────┘  │         │  └───────────────────────┘  │
└─────────────────────────┘         └─────────────────────────────┘
        :5173                                :8081
```

**Data flow on upload:**

1. User submits image via `UploadForm` (multipart POST to `/api/upload`).
2. Backend validates, processes (crop + resize), and saves the image to `uploads/`.
3. Image metadata is stored in the in-memory `ImageStore`.
4. Backend broadcasts a `new_image` event to all WebSocket clients via `Hub`.
5. Connected frontends receive the event through `useWebSocket` and prepend the image to the feed.

## Project Structure

```
mini-insta/
├── backend/
│   ├── main.py                 # FastAPI app, CORS, route registration, startup
│   ├── requirements.txt        # Python dependencies
│   ├── api/
│   │   ├── feed.py             # GET /api/feed -- paginated image listing
│   │   └── upload.py           # POST /api/upload -- image upload + processing
│   ├── models/
│   │   └── image.py            # Image dataclass & thread-safe ImageStore
│   ├── ws/
│   │   └── hub.py              # WebSocket connection hub & broadcasting
│   └── uploads/                # Uploaded images (gitignored)
│
├── frontend/
│   ├── index.html              # HTML entry point
│   ├── package.json            # Node dependencies & scripts
│   ├── vite.config.ts          # Vite build configuration
│   ├── tsconfig.json           # TypeScript config (references)
│   ├── tsconfig.app.json       # TypeScript app config (strict)
│   ├── eslint.config.js        # ESLint configuration
│   └── src/
│       ├── main.tsx            # React entry point
│       ├── App.tsx             # Root component (layout)
│       ├── api.ts              # API base URLs & endpoint helpers
│       ├── types.ts            # TypeScript interfaces (Image)
│       ├── index.css           # Global styles
│       ├── components/
│       │   ├── Feed.tsx        # Image feed with infinite scroll & filtering
│       │   ├── UploadForm.tsx  # Upload form with drag-and-drop
│       │   └── ImageCard.tsx   # Single image card display
│       └── hooks/
│           └── useWebSocket.ts # WebSocket connection with auto-reconnect
│
├── .gitignore
└── README.md
```

## Prerequisites

- **Python** 3.12 or higher
- **Node.js** 18 or higher
- **npm** 9 or higher (comes with Node.js)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd mini-insta
```

### 2. Start the backend

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Run the server (auto-reload enabled)
python main.py
```

The backend starts at **http://localhost:8081**.

### 3. Start the frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

The frontend starts at **http://localhost:5173**.

### 4. Open the app

Navigate to **http://localhost:5173** in your browser. Upload an image using the sidebar form and watch it appear in the feed in real time.

## Environment Variables

### Frontend

Set these in a `.env` file inside `frontend/`, or export them in your shell:

| Variable       | Default                  | Description                |
| -------------- | ------------------------ | -------------------------- |
| `VITE_API_URL` | `http://localhost:8081`  | Backend REST API base URL  |
| `VITE_WS_URL`  | `ws://localhost:8081`    | Backend WebSocket base URL |

### Backend

| Variable | Default | Description         |
| -------- | ------- | ------------------- |
| `PORT`   | `8081`  | Server listen port  |

## API Reference

### `GET /api/feed`

Returns a paginated list of images, newest first.

**Query parameters:**

| Param    | Type | Default | Constraints | Description           |
| -------- | ---- | ------- | ----------- | --------------------- |
| `offset` | int  | 0       | >= 0        | Number of items to skip |
| `limit`  | int  | 20      | 1 -- 50     | Number of items to return |

**Response (`200 OK`):**

```json
{
  "images": [
    {
      "id": "uuid-string",
      "title": "Sunset photo",
      "tags": ["nature", "sunset"],
      "filename": "uuid.jpg",
      "url": "/uploads/uuid.jpg",
      "created_at": "2025-01-15T10:30:00"
    }
  ],
  "total": 42,
  "offset": 0,
  "limit": 20
}
```

### `POST /api/upload`

Uploads an image with metadata.

**Content-Type:** `multipart/form-data`

| Field   | Type   | Required | Description                        |
| ------- | ------ | -------- | ---------------------------------- |
| `title` | string | Yes      | Image title (must be non-empty)    |
| `tags`  | string | No       | Comma-separated tags               |
| `image` | file   | Yes      | JPEG or PNG image (max 10 MB)      |

**Response (`201 Created`):**

```json
{
  "id": "uuid-string",
  "title": "Sunset photo",
  "tags": ["nature", "sunset"],
  "filename": "uuid.jpg",
  "url": "/uploads/uuid.jpg",
  "created_at": "2025-01-15T10:30:00"
}
```

**Error responses:**

| Status | Reason                              |
| ------ | ----------------------------------- |
| 400    | Missing title or image              |
| 400    | Unsupported file format (not JPEG/PNG) |
| 400    | File exceeds 10 MB size limit       |

### `GET /uploads/{filename}`

Serves uploaded images as static files.

## WebSocket Protocol

**Endpoint:** `ws://localhost:8081/ws`

After connecting, the server sends JSON messages when new images are uploaded:

```json
{
  "type": "new_image",
  "image": {
    "id": "uuid-string",
    "title": "Sunset photo",
    "tags": ["nature", "sunset"],
    "filename": "uuid.jpg",
    "url": "/uploads/uuid.jpg",
    "created_at": "2025-01-15T10:30:00"
  }
}
```

The frontend `useWebSocket` hook handles automatic reconnection with a 2-second delay on disconnection.

## Image Processing

All uploaded images go through server-side processing via Pillow:

1. **Validation** -- Only JPEG and PNG formats are accepted.
2. **Center crop** -- The image is cropped to the largest centered square.
3. **Resize** -- Cropped image is resized to **512x512** pixels.
4. **Save** -- JPEG images are saved at quality 85; PNG images preserve their format.
5. **Naming** -- Files are stored with UUID-based filenames to avoid collisions.

## Frontend Details

- **State management:** Local component state with React hooks (no global store).
- **Infinite scroll:** Uses `IntersectionObserver` to detect when the user scrolls near the bottom and loads the next page (20 images per page).
- **Fuzzy search:** Fuse.js with a threshold of 0.4, searching the `tags` field.
- **Lazy loading:** Images use the `loading="lazy"` attribute for deferred loading.
- **Styling:** Plain CSS with custom properties for theming (indigo/purple gradient accent). Responsive grid layout with `auto-fill` and `minmax(250px, 1fr)`.

### Available scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start Vite dev server with hot reload    |
| `npm run build`   | TypeScript compile + production build    |
| `npm run preview` | Preview the production build locally     |
| `npm run lint`    | Run ESLint checks                        |

## Backend Details

- **Framework:** FastAPI with Uvicorn ASGI server.
- **CORS:** All origins, methods, and headers are allowed (development configuration).
- **Storage:** In-memory `ImageStore` using a thread-safe list (`threading.Lock`). Image files are persisted to the `uploads/` directory.
- **WebSocket hub:** Manages connected clients with `asyncio.Lock`. Broadcasts are sent to all clients; stale connections are removed automatically.
- **Dependency injection:** `ImageStore` and `Hub` instances are created in `main.py` and injected into route modules via `init()` functions.

## Known Limitations

- **No persistence** -- Image metadata is stored in memory only. Restarting the backend loses all feed data (uploaded files remain on disk but won't appear in the feed).
- **No authentication** -- All uploads are anonymous with no user accounts, rate limiting, or abuse prevention.
- **No database** -- Single-process only; cannot scale horizontally without adding a database.
- **CORS wide open** -- All origins are allowed, which is suitable for development but should be restricted in production.
- **No Docker config** -- No Dockerfile or docker-compose is provided.
