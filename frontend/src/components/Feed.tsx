import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Fuse from "fuse.js";
import { API } from "../api";
import type { ImageData, FeedResponse } from "../types";
import { useWebSocket } from "../hooks/useWebSocket";
import ImageCard from "./ImageCard";

const PAGE_SIZE = 20;

export default function Feed() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [filter, setFilter] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchImages = useCallback(
    async (offset: number) => {
      setLoading(true);
      try {
        const res = await fetch(API.feed(offset, PAGE_SIZE));
        if (!res.ok) throw new Error("Failed to fetch feed");
        const data: FeedResponse = await res.json();
        setImages((prev) =>
          offset === 0 ? data.images : [...prev, ...data.images]
        );
        setTotal(data.total);
      } catch (err) {
        console.error("Feed fetch error:", err);
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    },
    []
  );

  // Initial load.
  useEffect(() => {
    fetchImages(0);
  }, [fetchImages]);

  // WebSocket: prepend new images live.
  useWebSocket(
    useCallback((img: ImageData) => {
      setImages((prev) => {
        if (prev.some((p) => p.id === img.id)) return prev;
        return [img, ...prev];
      });
      setTotal((t) => t + 1);
    }, [])
  );

  // Infinite scroll via IntersectionObserver.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && images.length < total) {
          fetchImages(images.length);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [images.length, total, loading, fetchImages]);

  // Fuzzy filter using Fuse.js.
  const fuse = useMemo(
    () =>
      new Fuse(images, {
        keys: ["tags"],
        threshold: 0.4,
        useExtendedSearch: false,
      }),
    [images]
  );

  const displayed = filter.trim()
    ? fuse.search(filter.trim()).map((r) => r.item)
    : images;

  return (
    <div className="feed-container">
      <div className="filter-bar">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by tags..."
          className="filter-input"
        />
        {filter && (
          <span className="filter-count">
            {displayed.length} result{displayed.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {initialLoad ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon">&#128444;</span>
          {filter ? (
            <>
              <h3>No matches</h3>
              <p>No images match your filter. Try a different tag.</p>
            </>
          ) : (
            <>
              <h3>No images yet</h3>
              <p>Upload your first image to get started.</p>
            </>
          )}
        </div>
      ) : (
        <div className="image-grid">
          {displayed.map((img) => (
            <ImageCard key={img.id} image={img} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="sentinel" />
      {loading && !initialLoad && (
        <div className="loading-spinner"><div className="spinner" /></div>
      )}
    </div>
  );
}
