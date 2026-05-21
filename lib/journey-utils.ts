export function pickJourneyCoverImage(
  itineraryItems: {
    poi: {
      galleries: {
        imageUrl: string;
      }[];
    };
  }[]
) {
  const imageUrls = Array.from(
    new Set(
      itineraryItems.flatMap(item =>
        item.poi.galleries
          .map(gallery => gallery.imageUrl.trim())
          .filter(Boolean)
      )
    )
  );

  if (imageUrls.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * imageUrls.length);

  return imageUrls[randomIndex] ?? null;
}
