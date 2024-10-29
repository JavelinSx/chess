export const titles = [
  { name: 'Beginner', minRating: 0, maxRating: 1199 },
  { name: 'Amateur', minRating: 1200, maxRating: 1399 },
  { name: 'Advanced', minRating: 1400, maxRating: 1599 },
  { name: 'Expert', minRating: 1600, maxRating: 1799 },
  { name: 'Master', minRating: 1800, maxRating: 2199 },
  { name: 'GrandMaster', minRating: 2200, maxRating: Infinity },
];

export function getTitleForRating(rating: number): string {
  for (const title of titles) {
    if (rating >= title.minRating && rating <= title.maxRating) {
      return title.name;
    }
  }
  return 'Неизвестный титул';
}
