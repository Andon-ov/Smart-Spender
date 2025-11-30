export interface DatabaseConfig {
  name: string;
  version: number;
}

export interface DatabaseResult {
  rows: {
    _array: any[];
    length: number;
    item: (index: number) => any;
  };
  insertId?: number;
  rowsAffected: number;
}
