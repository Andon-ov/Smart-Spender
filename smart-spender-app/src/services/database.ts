import * as SQLite from 'expo-sqlite';
import { Receipt, ReceiptItem, Category, Budget, DEFAULT_CATEGORIES } from '../types';

const DB_NAME = 'smart_spender.db';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME);
      await this.createTables();
      await this.initializeCategories();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Create receipts table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_name TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        total_amount REAL NOT NULL,
        vat REAL,
        payment_method TEXT,
        category TEXT NOT NULL,
        image_uri TEXT,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create items table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receipt_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity REAL DEFAULT 1,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
      );
    `);

    // Create categories table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        icon TEXT,
        color TEXT,
        budget_limit REAL
      );
    `);

    // Create budgets table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL,
        category_id INTEGER,
        limit_amount REAL NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    `);

    console.log('Tables created successfully');
  }

  private async initializeCategories(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    for (const category of DEFAULT_CATEGORIES) {
      try {
        await this.db.runAsync(
          'INSERT OR IGNORE INTO categories (name, icon, color) VALUES (?, ?, ?)',
          [category.name, category.icon, category.color]
        );
      } catch (error) {
        console.error('Error inserting category:', error);
      }
    }
  }

  // Receipt operations
  async createReceipt(receipt: Receipt, items: ReceiptItem[]): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.runAsync(
        `INSERT INTO receipts (shop_name, date, time, total_amount, vat, payment_method, category, image_uri, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          receipt.shop_name,
          receipt.date,
          receipt.time || null,
          receipt.total_amount,
          receipt.vat || null,
          receipt.payment_method || null,
          receipt.category,
          receipt.image_uri || null,
          receipt.notes || null,
        ]
      );

      const receiptId = result.lastInsertRowId;

      // Insert items
      for (const item of items) {
        await this.db.runAsync(
          `INSERT INTO items (receipt_id, product_name, quantity, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?)`,
          [receiptId, item.product_name, item.quantity, item.unit_price, item.total_price]
        );
      }

      return receiptId;
    } catch (error) {
      console.error('Error creating receipt:', error);
      throw error;
    }
  }

  async getReceipts(limit?: number, offset?: number): Promise<Receipt[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      let query = 'SELECT * FROM receipts ORDER BY date DESC, time DESC';
      const params: any[] = [];

      if (limit !== undefined) {
        query += ' LIMIT ?';
        params.push(limit);
        
        if (offset !== undefined) {
          query += ' OFFSET ?';
          params.push(offset);
        }
      }

      const result = await this.db.getAllAsync<Receipt>(query, params);
      return result;
    } catch (error) {
      console.error('Error getting receipts:', error);
      throw error;
    }
  }

  async getReceiptById(id: number): Promise<Receipt | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const receipt = await this.db.getFirstAsync<Receipt>(
        'SELECT * FROM receipts WHERE id = ?',
        [id]
      );

      if (receipt) {
        const items = await this.db.getAllAsync<ReceiptItem>(
          'SELECT * FROM items WHERE receipt_id = ?',
          [id]
        );
        receipt.items = items;
      }

      return receipt;
    } catch (error) {
      console.error('Error getting receipt by id:', error);
      throw error;
    }
  }

  async updateReceipt(id: number, receipt: Partial<Receipt>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const fields = Object.keys(receipt).filter(key => key !== 'id' && key !== 'items');
      const values = fields.map(key => (receipt as any)[key]);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      await this.db.runAsync(
        `UPDATE receipts SET ${setClause} WHERE id = ?`,
        [...values, id]
      );
    } catch (error) {
      console.error('Error updating receipt:', error);
      throw error;
    }
  }

  async deleteReceipt(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM receipts WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting receipt:', error);
      throw error;
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync<Category>('SELECT * FROM categories');
      return result;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Statistics operations
  async getTotalExpenses(startDate?: string, endDate?: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      let query = 'SELECT SUM(total_amount) as total FROM receipts';
      const params: string[] = [];

      if (startDate && endDate) {
        query += ' WHERE date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      const result = await this.db.getFirstAsync<{ total: number }>(query, params);
      return result?.total || 0;
    } catch (error) {
      console.error('Error getting total expenses:', error);
      throw error;
    }
  }

  async getExpensesByCategory(startDate?: string, endDate?: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      let query = `
        SELECT category, SUM(total_amount) as total, COUNT(*) as count
        FROM receipts
      `;
      const params: string[] = [];

      if (startDate && endDate) {
        query += ' WHERE date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      query += ' GROUP BY category ORDER BY total DESC';

      const result = await this.db.getAllAsync(query, params);
      return result;
    } catch (error) {
      console.error('Error getting expenses by category:', error);
      throw error;
    }
  }

  async getDailyExpenses(startDate: string, endDate: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(
        `SELECT date, SUM(total_amount) as total
         FROM receipts
         WHERE date BETWEEN ? AND ?
         GROUP BY date
         ORDER BY date ASC`,
        [startDate, endDate]
      );
      return result;
    } catch (error) {
      console.error('Error getting daily expenses:', error);
      throw error;
    }
  }

  async getMonthlyExpenses(year: number): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(
        `SELECT strftime('%Y-%m', date) as month, SUM(total_amount) as total
         FROM receipts
         WHERE strftime('%Y', date) = ?
         GROUP BY month
         ORDER BY month ASC`,
        [year.toString()]
      );
      return result;
    } catch (error) {
      console.error('Error getting monthly expenses:', error);
      throw error;
    }
  }

  async getTopExpenses(limit: number = 10, startDate?: string, endDate?: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      let query = `
        SELECT shop_name, total_amount, date, category
        FROM receipts
      `;
      const params: any[] = [];

      if (startDate && endDate) {
        query += ' WHERE date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      query += ' ORDER BY total_amount DESC LIMIT ?';
      params.push(limit);

      const result = await this.db.getAllAsync(query, params);
      return result;
    } catch (error) {
      console.error('Error getting top expenses:', error);
      throw error;
    }
  }

  async searchReceipts(searchTerm: string): Promise<Receipt[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync<Receipt>(
        `SELECT * FROM receipts
         WHERE shop_name LIKE ? OR notes LIKE ? OR category LIKE ?
         ORDER BY date DESC`,
        [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
      );
      return result;
    } catch (error) {
      console.error('Error searching receipts:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
  }
}

export default new DatabaseService();
