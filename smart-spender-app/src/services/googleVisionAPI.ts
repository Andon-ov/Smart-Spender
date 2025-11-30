import { ReceiptAnalysisResult } from '../types';

const GOOGLE_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || '';
const GOOGLE_VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

const ANALYZE_RECEIPT_PROMPT = `
Анализирай този текст от касова бележка и извлечи следната информация във JSON формат.

Върни САМО валиден JSON обект без никакъв допълнителен текст, в следния формат:

{
  "shop_name": "име на магазина",
  "date": "YYYY-MM-DD формат",
  "time": "HH:MM формат",
  "items": [
    {
      "product_name": "име на продукт",
      "quantity": число,
      "unit_price": число,
      "total_price": число
    }
  ],
  "total_amount": число,
  "vat": число или null,
  "payment_method": "кеш/карта/друго или null",
  "suggested_category": "една от: Храна, Транспорт, Здраве, Забавление, Облекло, Битови, Електроника, Други"
}

Важни правила:
- Бъди максимално точен при извличането на данни
- Ако нещо не може да се извлече, използвай null
- Всички цени трябва да са числа (не стрингове)
- Датата трябва да е в формат YYYY-MM-DD
- Времето трябва да е в формат HH:MM (24-часов формат)
- За категорията, избери най-подходящата от списъка
`;

class GoogleVisionService {
  private apiKey: string;

  constructor() {
    this.apiKey = GOOGLE_VISION_API_KEY;
  }

  async analyzeReceipt(imageBase64: string): Promise<ReceiptAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('Google Vision API key not configured. Please set EXPO_PUBLIC_GOOGLE_VISION_API_KEY in your .env file');
    }

    try {
      // Step 1: Extract text from image using Google Vision
      const textResult = await this.extractText(imageBase64);
      
      // Step 2: Analyze the extracted text with Claude (since Google Vision only extracts text)
      // For now, we'll use a simple parsing. In production, you might want to use another AI service
      const result = this.parseReceiptText(textResult);

      return result;
    } catch (error) {
      console.error('Error analyzing receipt with Google Vision:', error);
      throw error;
    }
  }

  private async extractText(imageBase64: string): Promise<string> {
    const response = await fetch(GOOGLE_VISION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: imageBase64,
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 1,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google Vision API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    if (!data.responses || data.responses.length === 0) {
      throw new Error('No response from Google Vision API');
    }

    const textAnnotations = data.responses[0].textAnnotations;
    if (!textAnnotations || textAnnotations.length === 0) {
      throw new Error('No text detected in the image');
    }

    return textAnnotations[0].description;
  }

  private parseReceiptText(text: string): ReceiptAnalysisResult {
    // Simple parsing logic - in production, you might want to use AI for this
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract shop name (usually first line)
    const shop_name = lines[0] || 'Неизвестен магазин';

    // Look for total amount
    const totalMatch = text.match(/общо[:\s]*([\d.,]+)/i) || text.match(/total[:\s]*([\d.,]+)/i);
    const total_amount = totalMatch ? parseFloat(totalMatch[1].replace(',', '.')) : 0;

    // Look for date
    const dateMatch = text.match(/(\d{2}[./-]\d{2}[./-]\d{4})/) || text.match(/(\d{4}[./-]\d{2}[./-]\d{2})/);
    let date = '2025-01-01'; // Default date
    if (dateMatch) {
      const dateStr = dateMatch[1];
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else if (dateStr.includes('.')) {
        const [day, month, year] = dateStr.split('.');
        date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        date = dateStr;
      }
    }

    // Simple items extraction (this is very basic - real implementation would be more sophisticated)
    const items: { product_name: string; quantity: number; unit_price: number; total_price: number }[] = [];
    const itemLines = lines.filter(line => /\d+[.,]\d{2}/.test(line)); // Lines with prices
    
    itemLines.forEach(line => {
      const priceMatch = line.match(/(\d+[.,]\d{2})/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(',', '.'));
        const productName = line.replace(priceMatch[0], '').trim();
        if (productName) {
          items.push({
            product_name: productName,
            quantity: 1,
            unit_price: price,
            total_price: price,
          });
        }
      }
    });

    return {
      shop_name,
      date,
      time: undefined,
      items,
      total_amount,
      vat: undefined,
      payment_method: undefined,
      suggested_category: 'Храна', // Default category
    };
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }
}

export default new GoogleVisionService();