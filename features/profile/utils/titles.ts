export const titles = [
  { name: 'Beginner', minRating: 0, maxRating: 299 },
  { name: 'Amateur', minRating: 300, maxRating: 599 },
  { name: 'Advanced', minRating: 600, maxRating: 899 },
  { name: 'Expert', minRating: 900, maxRating: 1199 },
  { name: 'Master', minRating: 1200, maxRating: 1499 },
  { name: 'GrandMaster', minRating: 1500, maxRating: Infinity },
];

export function getTitleForRating(rating: number): string {
  for (const title of titles) {
    if (rating >= title.minRating && rating <= title.maxRating) {
      return title.name;
    }
  }
  return 'Неизвестный титул';
}
