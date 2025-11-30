import { CategoryStatistics } from '../types';

export const calculateCategoryPercentages = (
  categories: Array<{ category: string; total: number }>,
  grandTotal: number
): CategoryStatistics[] => {
  return categories.map(cat => ({
    category: cat.category,
    total: cat.total,
    percentage: grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0,
    count: 0, // This should be passed from the data
  }));
};

export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
};

export const calculateMonthlyProjection = (
  currentTotal: number,
  daysElapsed: number,
  totalDaysInMonth: number
): number => {
  if (daysElapsed === 0) return 0;
  const dailyAverage = currentTotal / daysElapsed;
  return dailyAverage * totalDaysInMonth;
};

export const calculateBudgetUsage = (spent: number, budget: number): number => {
  if (budget === 0) return 0;
  return (spent / budget) * 100;
};

export const getBudgetStatus = (
  spent: number,
  budget: number
): 'safe' | 'warning' | 'danger' => {
  const usage = calculateBudgetUsage(spent, budget);
  
  if (usage < 75) return 'safe';
  if (usage < 100) return 'warning';
  return 'danger';
};

export const groupByDate = (
  items: Array<{ date: string; [key: string]: any }>
): Map<string, any[]> => {
  const grouped = new Map<string, any[]>();
  
  items.forEach(item => {
    const existing = grouped.get(item.date) || [];
    grouped.set(item.date, [...existing, item]);
  });
  
  return grouped;
};

export const sumBy = (items: any[], key: string): number => {
  return items.reduce((sum, item) => sum + (item[key] || 0), 0);
};
