export interface Category {
  id?: number;
  name: string;
  icon: string;
  color: string;
  budget_limit?: number;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Храна', icon: '🍕', color: '#FF6B6B' },
  { name: 'Транспорт', icon: '🚗', color: '#4ECDC4' },
  { name: 'Здраве', icon: '💊', color: '#45B7D1' },
  { name: 'Забавление', icon: '🎮', color: '#FFA07A' },
  { name: 'Облекло', icon: '👕', color: '#DDA15E' },
  { name: 'Битови', icon: '💡', color: '#BC6C25' },
  { name: 'Електроника', icon: '📱', color: '#6C63FF' },
  { name: 'Други', icon: '📦', color: '#95A5A6' },
];
