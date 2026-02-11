export interface ImageData {
  id: string;
  title: string;
  tags: string[];
  filename: string;
  url: string;
  created_at: string;
}

export interface FeedResponse {
  images: ImageData[];
  total: number;
  offset: number;
  limit: number;
}
