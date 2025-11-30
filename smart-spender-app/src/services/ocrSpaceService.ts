import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';

export interface ReceiptItem {
  productName: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice: number;
}

export interface ReceiptAnalysisResult {
  storeName?: string;
  date?: string;
  total?: number;
  items: ReceiptItem[];
  rawText: string;
}

export class OCRSpaceService {
  private apiKey = 'helloworld';

  private async compressImage(imageUri: string): Promise<string> {
    try {
      const compressed = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }],
        {
          compress: 0.5,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return compressed.uri;
    } catch (error) {
      console.warn('Image compression failed, using original:', error);
      return imageUri;
    }
  }

  async analyzeReceipt(imageUri: string): Promise<ReceiptAnalysisResult> {
    try {
      console.log('Starting OCR.space analysis...');

      const compressedUri = await this.compressImage(imageUri);

      const response = await fetch(compressedUri);
      const blob = await response.blob();
      const base64DataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      console.log(`Image size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);

      const ocrResponse = await axios.post('https://api.ocr.space/parse/image', {
        apikey: this.apiKey,
        base64Image: base64DataUrl,
        language: 'eng',
        isOverlayRequired: false,
        scale: true,
        OCREngine: 2
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (ocrResponse.data.IsErroredOnProcessing) {
        throw new Error(`OCR.space error: ${ocrResponse.data.ErrorMessage?.join(', ')}`);
      }

      const text = ocrResponse.data.ParsedResults?.[0]?.ParsedText || '';
      console.log('Extracted text:', text);

      const result = this.parseReceiptText(text);
      return result;

    } catch (error) {
      console.error('OCR.space error:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`OCR API failed: ${error.response?.data?.ErrorMessage || error.message}`);
      }
      throw new Error(`OCR failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private parseReceiptText(text: string): ReceiptAnalysisResult {
    const result: ReceiptAnalysisResult = {
      rawText: text,
      items: []
    };

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // === EXTRACT STORE NAME ===
    const storeNamePatterns = [
      /^([A-Z\s&]+)$/i,
      /^(.+?(?=ФИСКАЛЕН|КАСА|БОЛЕТ|ЧЕК|ФИСК|КВИТАНЦИЯ))/i,
      /^(.+?(?=ЕИК|БУЛСТАТ|ИНН))/i,
      /^(.+?(?=\d{9,13}))/i,
      /^(.+?(?=ДАТА|ЧАС|ВРЕМЕ))/i
    ];

    for (const line of lines.slice(0, 10)) {
      if (line.match(/^\d/) || line.match(/ФИСКАЛЕН|КАСА|БОЛЕТ|ЧЕК|ДАТА|ЧАС|ВРЕМЕ|ЕИК|БУЛСТАТ/i)) {
        continue;
      }

      for (const pattern of storeNamePatterns) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].length > 2 && match[1].length < 50) {
          let storeName = match[1].trim();
          storeName = storeName.replace(/^(ООД|ЕООД|АД|ЕАД|ООД-|ЕООД-|АД-|ЕАД-)\s*/i, '');
          storeName = storeName.replace(/\s*(ООД|ЕООД|АД|ЕАД|СДРУЖЕНИЕ|КООПЕРАЦИЯ)$/i, '');
          result.storeName = storeName.trim();
          break;
        }
      }
      if (result.storeName) break;
    }

    // === EXTRACT DATE ===
    const datePatterns = [
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,
      /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2})/,
      /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
      /(\d{1,2}\.\d{1,2}\.\d{4})/,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{1,2}-\d{1,2}-\d{4})/
    ];

    for (const line of lines.slice(0, 15)) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          result.date = match[1];
          break;
        }
      }
      if (result.date) break;
    }

    // === EXTRACT ITEMS (NEW!) ===
    result.items = this.extractItems(lines);

    // === EXTRACT TOTAL ===
    const totalPatterns = [
      /(?:ОБЩО|ТОТАЛ|СУМА|ВСИЧКО|ЗА ПЛАЩАНЕ|КРАЙНА СУМА|ОБЩО ЗА ПЛАЩАНЕ)\s*[:]*\s*(\d+[.,]\d{2})/i,
      /(?:ОБЩО|ТОТАЛ|СУМА|ВСИЧКО|ЗА ПЛАЩАНЕ|КРАЙНА СУМА)\s*(\d+[.,]\d{2})/i,
      /(?:ОБЩО|ТОТАЛ|СУМА|ВСИЧКО)\s*[=]*\s*(\d+[.,]\d{2})/i,
      /=\s*(\d+[.,]\d{2})/,
      /(\d+[.,]\d{2})\s*(?:ЛВ|LV|ЛЕВА)/i,
      /(\d+[.,]\d{2})\s*$/
    ];

    // First: search lines with payment keywords
    for (const line of lines) {
      if (line.match(/ЗА ПЛАЩАНЕ|КРАЙНА СУМА|ОБЩО ЗА ПЛАЩАНЕ|ТОТАЛ|ВСИЧКО/i)) {
        for (const pattern of totalPatterns) {
          const match = line.match(pattern);
          if (match) {
            const price = parseFloat(match[1].replace(',', '.'));
            if (price > 0 && price < 10000) {
              result.total = price;
              break;
            }
          }
        }
        if (result.total) break;
      }
    }

    // Second: search from bottom (last 15 lines)
    if (!result.total) {
      for (let i = lines.length - 1; i >= Math.max(0, lines.length - 15); i--) {
        const line = lines[i];
        for (const pattern of totalPatterns) {
          const match = line.match(pattern);
          if (match) {
            const price = parseFloat(match[1].replace(',', '.'));
            if (price > 0 && price < 10000) {
              result.total = price;
              break;
            }
          }
        }
        if (result.total) break;
      }
    }

    return result;
  }

  /**
   * Извлича продуктите от бележката
   */
  private extractItems(lines: string[]): ReceiptItem[] {
    const items: ReceiptItem[] = [];
    
    // Ключови думи, които указват край на списъка с продукти
    const endKeywords = [
      'ОБЩО', 'ТОТАЛ', 'СУМА', 'ВСИЧКО', 'ЗА ПЛАЩАНЕ', 'КРАЙНА СУМА',
      'МЕЖДИННА СУМА', 'ПОДСУМА', 'SUBTOTAL',
      'ДДС', 'VAT', 'ДАНЪК',
      'ПОЛУЧЕНА СУМА', 'ПЛАТЕНО', 'РЕСТО',
      'ФИСКАЛЕН', 'КАСОВ', 'БОЛЕТ'
    ];

    // Думи, които НЕ са продукти (header информация)
    const skipKeywords = [
      'КАСА', 'КАСИЕР', 'ОПЕРАТОР',
      'ЕИК', 'БУЛСТАТ', 'ИНН', 'ДДС', 'МОЛ',
      'АДРЕС', 'ТЕЛ', 'ТЕЛЕФОН',
      'ДАТА', 'ЧАС', 'ВРЕМЕ',
      'ФИСКАЛНА ПАМЕТ', 'ФИСКАЛНО УСТРОЙСТВО'
    ];

    let startIndex = 0;
    let endIndex = lines.length;

    // Намери къде започват продуктите (след header информацията)
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i];
      
      // Пропусни header редове
      if (skipKeywords.some(keyword => line.toUpperCase().includes(keyword))) {
        startIndex = i + 1;
        continue;
      }

      // Ако видим ред с продукт и цена, това е началото
      if (this.looksLikeProductLine(line)) {
        startIndex = i;
        break;
      }
    }

    // Намери къде завършват продуктите (преди subtotal/total секцията)
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (endKeywords.some(keyword => line.toUpperCase().includes(keyword))) {
        endIndex = i;
        break;
      }
    }

    // Извлечи продуктите от определената зона
    for (let i = startIndex; i < endIndex; i++) {
      const line = lines[i];
      
      // Пропусни празни или твърде къси редове
      if (line.length < 3) continue;

      // Пропусни редове с keywords
      if (skipKeywords.some(keyword => line.toUpperCase().includes(keyword))) {
        continue;
      }

      const item = this.parseProductLine(line);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  /**
   * Проверява дали редът прилича на ред с продукт
   */
  private looksLikeProductLine(line: string): boolean {
    // Търси шаблон: текст + число (цена)
    const hasPrice = /\d+[.,]\d{2}/.test(line);
    const hasText = /[A-Za-zА-Яа-я]{3,}/.test(line);
    
    return hasPrice && hasText;
  }

  /**
   * Парсва ред с продукт и извлича информация
   */
  private parseProductLine(line: string): ReceiptItem | null {
    // Различни формати на редове с продукти:
    // 1. "Мляко 1.50"
    // 2. "Хляб 0.800 кг х 2.50 = 2.00"
    // 3. "Кафе 2 х 1.50 = 3.00"
    // 4. "Пица Маргарита 8.50 лв"
    // 5. "1 Хляб 1.20"

    // Pattern 1: Име + количество + 'х' + единична цена + '=' + обща цена
    // Пример: "Хляб 2 х 1.50 = 3.00"
    const pattern1 = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*[xхXХ]\s*(\d+[.,]\d{2})\s*=\s*(\d+[.,]\d{2})/;
    let match = line.match(pattern1);
    if (match) {
      return {
        productName: match[1].trim(),
        quantity: parseFloat(match[2].replace(',', '.')),
        unitPrice: parseFloat(match[3].replace(',', '.')),
        totalPrice: parseFloat(match[4].replace(',', '.'))
      };
    }

    // Pattern 2: Име + цена в края
    // Пример: "Мляко Верея 2.50"
    const pattern2 = /^(.+?)\s+(\d+[.,]\d{2})(?:\s*(?:ЛВ|LV|ЛЕВА))?$/i;
    match = line.match(pattern2);
    if (match) {
      const productName = match[1].trim();
      const price = parseFloat(match[2].replace(',', '.'));
      
      // Провери дали не е твърде късо име (вероятно не е продукт)
      if (productName.length < 3) return null;
      
      // Провери за разумна цена (изключи много малки и много големи)
      if (price < 0.10 || price > 1000) return null;

      return {
        productName,
        totalPrice: price
      };
    }

    // Pattern 3: Количество в началото + име + цена
    // Пример: "1 Хляб 1.20"
    const pattern3 = /^(\d+)\s+(.+?)\s+(\d+[.,]\d{2})$/;
    match = line.match(pattern3);
    if (match) {
      return {
        productName: match[2].trim(),
        quantity: parseFloat(match[1]),
        totalPrice: parseFloat(match[3].replace(',', '.'))
      };
    }

    // Pattern 4: Име с код/номер + цена
    // Пример: "123 Coca Cola 2.50"
    const pattern4 = /^\d+\s+(.+?)\s+(\d+[.,]\d{2})$/;
    match = line.match(pattern4);
    if (match) {
      return {
        productName: match[1].trim(),
        totalPrice: parseFloat(match[2].replace(',', '.'))
      };
    }

    return null;
  }
}

export const ocrSpaceService = new OCRSpaceService();