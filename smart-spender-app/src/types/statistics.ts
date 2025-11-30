export interface Budget {
  id?: number;
  month: string; // YYYY-MM format
  category_id?: number;
  limit_amount: number;
}

export interface StatisticsPeriod {
  startDate: string;
  endDate: string;
}

export interface CategoryStatistics {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

export interface DailyStatistics {
  date: string;
  total: number;
}

export interface MonthlyStatistics {
  month: string;
  total: number;
}

export interface TopExpense {
  shop_name: string;
  total_amount: number;
  date: string;
  category: string;
}
