export type ContentType = "document" | "video";
export type FileType = "PDF" | "DOC" | "EPUB";

export interface LibraryMaterial {
  id: string;
  contentType: ContentType;
  title: string;
  description: string;
  image: string; // URL of cover image
  timePosted: string; // ISO timestamp or formatted date string
  readingDuration: string; // e.g. "45 min read" or "18 min watch"

  // Document-specific
  documentUrl?: string;
  fileType?: FileType;
  fileSize?: string;
  isDownloadable?: boolean;

  // Video-specific
  youtubeUrl?: string;

  // Engagement (always initialized to 0 on create)
  likesCount: number;
  commentsCount: number;

  // Target platforms
  publishToApp?: boolean;
  publishToWeb?: boolean;
}
