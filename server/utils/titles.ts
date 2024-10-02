export const titles = [
  { name: 'Новичок', minRating: 0, maxRating: 1199 },
  { name: 'Любитель', minRating: 1200, maxRating: 1399 },
  { name: 'Опытный игрок', minRating: 1400, maxRating: 1599 },
  { name: 'Эксперт', minRating: 1600, maxRating: 1799 },
  { name: 'Мастер', minRating: 1800, maxRating: 2199 },
  { name: 'Гроссмейстер', minRating: 2200, maxRating: Infinity },
];

export function getTitleForRating(rating: number): string {
  for (const title of titles) {
    if (rating >= title.minRating && rating <= title.maxRating) {
      return title.name;
    }
  }
  return 'Неизвестный титул';
}
