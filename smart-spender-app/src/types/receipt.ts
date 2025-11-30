export interface ReceiptItem {
  id?: number;
  receipt_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Receipt {
  id?: number;
  shop_name: string;
  date: string; // YYYY-MM-DD format
  time?: string; // HH:MM format
  total_amount: number;
  vat?: number;
  payment_method?: string;
  category: string;
  image_uri?: string;
  notes?: string;
  created_at?: string;
  items?: ReceiptItem[];
}

export interface ReceiptAnalysisResult {
  shop_name: string;
  date: string;
  time?: string;
  items: {
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  total_amount: number;
  vat?: number;
  payment_method?: string;
  suggested_category: string;
}
