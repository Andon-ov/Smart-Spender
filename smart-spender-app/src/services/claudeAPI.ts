import { ReceiptAnalysisResult } from '../types';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';

const ANALYZE_RECEIPT_PROMPT = `
Анализирай тази снимка на касова бележка и извлечи следната информация във JSON формат.

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

interface ClaudeResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

class ClaudeService {
  private apiKey: string;

  constructor() {
    this.apiKey = CLAUDE_API_KEY;
  }

  async analyzeReceipt(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<ReceiptAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('Claude API key not configured. Please set EXPO_PUBLIC_CLAUDE_API_KEY in your .env file');
    }

    try {
      const response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mimeType,
                    data: imageBase64,
                  },
                },
                {
                  type: 'text',
                  text: ANALYZE_RECEIPT_PROMPT,
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data: ClaudeResponse = await response.json();
      
      if (!data.content || data.content.length === 0) {
        throw new Error('No content in Claude API response');
      }

      const textContent = data.content.find(c => c.type === 'text');
      if (!textContent) {
        throw new Error('No text content in Claude API response');
      }

      // Parse the JSON response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not extract JSON from Claude response');
      }

      const result: ReceiptAnalysisResult = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!result.shop_name || !result.date || !result.total_amount) {
        throw new Error('Missing required fields in receipt analysis');
      }

      return result;
    } catch (error) {
      console.error('Error analyzing receipt with Claude:', error);
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }
}

export default new ClaudeService();
