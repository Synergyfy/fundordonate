import { useState } from "react";

interface Image {
  id: string;
  url: string;
  alt?: string;
  order: number;
}

interface Props {
  featuredImage?: string;
  images: Image[];
  title: string;
}

export function CampaignImageGallery({ featuredImage, images, title }: Props) {
  const allImages = [
    ...(featuredImage ? [{ id: "featured", url: featuredImage, alt: title, order: -1 }] : []),
    ...images,
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);

  if (allImages.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-gray-100">
        <svg className="h-20 w-20 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  if (allImages.length === 1) {
    const img = allImages[0]!;
    return (
      <div className="overflow-hidden rounded-xl">
        <img
          src={img.url}
          alt={img.alt || title}
          className="aspect-video w-full object-cover"
        />
      </div>
    );
  }

  const currentImage = allImages[selectedIndex] || allImages[0]!;

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={currentImage.url}
          alt={currentImage.alt || title}
          className="aspect-video w-full object-cover"
        />
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setSelectedIndex((i) => (i > 0 ? i - 1 : allImages.length - 1))}
              className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedIndex((i) => (i < allImages.length - 1 ? i + 1 : 0))}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
              {selectedIndex + 1} / {allImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                index === selectedIndex
                  ? "border-primary-500"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <img src={image.url} alt={image.alt || ""} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
