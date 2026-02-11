import { useState, useRef, useCallback } from "react";
import { API } from "../api";

interface UploadFormProps {
  onUploaded?: () => void;
}

export default function UploadForm({ onUploaded }: UploadFormProps) {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectFile = useCallback((f: File | null) => {
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    selectFile(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    if (f && (f.type === "image/jpeg" || f.type === "image/png")) {
      selectFile(f);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("tags", tags.trim());
    formData.append("image", file);

    try {
      const res = await fetch(API.upload, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Upload failed");
      }

      setTitle("");
      setTags("");
      clearFile();
      onUploaded?.();
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Upload failed: could not connect to server");
      } else {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <h2>Upload Image</h2>

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your image a title"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="tags">Tags</label>
        <input
          id="tags"
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="nature, sunset, city (comma-separated)"
        />
      </div>

      {preview ? (
        <div className="preview">
          <img src={preview} alt="Preview" />
          <button type="button" className="preview-remove" onClick={clearFile}>
            &times;
          </button>
        </div>
      ) : (
        <div
          className={`dropzone${dragging ? " dragging" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <span className="dropzone-icon">&#128247;</span>
          <p className="dropzone-text">
            Drag & drop an image or <strong>browse</strong>
          </p>
          <p className="dropzone-hint">JPEG or PNG, max 10 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
          />
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={uploading || !file || !title.trim()}>
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}
