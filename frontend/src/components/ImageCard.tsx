import type { ImageData } from "../types";
import { API } from "../api";

interface ImageCardProps {
  image: ImageData;
}

export default function ImageCard({ image }: ImageCardProps) {
  return (
    <div className="image-card">
      <div className="img-wrapper">
        <img
          src={API.imageUrl(image.url)}
          alt={image.title}
          loading="lazy"
        />
      </div>
      <div className="image-info">
        <h3>{image.title}</h3>
        {image.tags && image.tags.length > 0 && (
          <div className="tags">
            {image.tags.map((tag, i) => (
              <span key={i} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
