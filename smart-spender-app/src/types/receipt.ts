export interface Receipt {
  id?: number;
  shop_name: string;
  date: string;
  time?: string;
  total_amount: number;
  vat?: number;
  payment_method?: string;
  category: string;
  image_uri?: string;
  notes?: string;
  created_at?: string;
  items?: ReceiptItem[];
}

export interface ReceiptItem {
  id?: number;
  receipt_id?: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}