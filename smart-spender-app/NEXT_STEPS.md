# Следващи стъпки за развитие на Smart Spender

## ✅ Готово (MVP)

1. ✅ Основна структура на проекта
2. ✅ TypeScript типове и интерфейси
3. ✅ SQLite database service с пълна схема
4. ✅ Claude API service за OCR анализ
5. ✅ Навигация с Bottom Tabs
6. ✅ Основни екрани (Dashboard, Scanner, History, Statistics, Settings)
7. ✅ Камера и Image Picker интеграция
8. ✅ Theme и константи
9. ✅ Utility функции (formatters, calculations)

## 🚧 За довършване

### ⚠️ TODO: Crop Button UX Problem
**Проблем**: След заснемане на снимка с `allowsEditing: true`, crop бутонът в Expo ImagePicker изглежда неактивен/замъглен, което обърква потребителите.

**Опитани решения:**
- ❌ Промяна на `aspect` ratio
- ❌ Увеличаване на `quality`
- ❌ Добавяне на hint badges

**Възможни решения за изследване:**
- Използване на custom crop библиотека (react-native-image-crop-picker)
- Имплементация на собствен crop UI
- Добавяне на tutorial overlay при първо използване
- Преминаване към custom camera screen с built-in crop

**Статус**: 🔴 Отложено - продължаваме с други функционалности

---

### 1. Scanner Screen - AI Интеграция
**Файл**: `src/screens/Scanner/ScannerScreen.tsx`

Трябва да се добави:
- Функция за конвертиране на изображение в base64
- Извикване на Claude API при натискане на "Анализирай"
- Показване на резултатите в нов екран
- Запазване в базата данни

**Пример код**:
```typescript
const analyzeImage = async () => {
  setIsProcessing(true);
  try {
    // Convert image to base64
    const base64 = await FileSystem.readAsStringAsync(image!, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Call Claude API
    const result = await ClaudeService.analyzeReceipt(base64);
    
    // Navigate to review screen with result
    navigation.navigate('ReceiptReview', { result });
  } catch (error) {
    Alert.alert('Грешка', 'Не успяхме да анализираме бележката');
  } finally {
    setIsProcessing(false);
  }
};
```

### 2. Receipt Review Screen
**Нов файл**: `src/screens/Scanner/ReceiptReviewScreen.tsx`

Екран за преглед и редакция на анализираната бележка преди запазване:
- Показване на извлечените данни
- Редакция на всяко поле
- Промяна на категория
- Бутон за запазване в базата

### 3. Dashboard - Real Data
**Файл**: `src/screens/Dashboard/DashboardScreen.tsx`

Трябва да се добави:
- useEffect hook за зареждане на данни от DB
- Показване на реални статистики
- Refresh functionality
- Бърз преглед на последните бележки

### 4. History Screen - List Implementation
**Файл**: `src/screens/History/HistoryScreen.tsx`

Трябва да се имплементира:
- FlatList с бележки от базата
- Pull-to-refresh
- Search функционалност
- Филтри по дата и категория
- Swipe actions (delete, edit)
- Navigation към ReceiptDetail screen

### 5. Receipt Detail Screen
**Нов файл**: `src/screens/History/ReceiptDetailScreen.tsx`

Детайлен преглед на бележка:
- Оригинална снимка
- Всички продукти
- Информация за магазин, дата, категория
- Бутони за Edit и Delete

### 6. Statistics Screen - Charts
**Файл**: `src/screens/Statistics/StatisticsScreen.tsx`

Визуализации с react-native-chart-kit:
- PieChart за категории
- LineChart за тренд
- BarChart за месечно сравнение
- Period selector (седмица, месец, година)

### 7. Custom Hooks

**Файл**: `src/hooks/useReceipts.ts`
```typescript
export const useReceipts = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReceipts = async () => {
    const data = await DatabaseService.getReceipts();
    setReceipts(data);
    setLoading(false);
  };

  useEffect(() => { loadReceipts(); }, []);

  return { receipts, loading, refresh: loadReceipts };
};
```

**Файл**: `src/hooks/useStatistics.ts`
- Hook за зареждане на статистики
- Calculations за различни периоди

### 8. Components

**Файл**: `src/components/receipts/ReceiptCard.tsx`
- Card компонент за показване на бележка в списък

**Файл**: `src/components/charts/CategoryPieChart.tsx`
- Pie chart за категории

**Файл**: `src/components/charts/ExpenseLineChart.tsx`
- Line chart за тренд

**Файл**: `src/components/common/Button.tsx`
- Reusable button компонент

**Файл**: `src/components/common/Card.tsx`
- Reusable card компонент

### 9. Navigation Enhancement
**Файл**: `src/navigation/AppNavigator.tsx`

Добавяне на Stack Navigator за:
- ReceiptReview screen
- ReceiptDetail screen
- ReceiptEdit screen

### 10. Settings Screen
**Файл**: `src/screens/Settings/SettingsScreen.tsx`

Добавяне на:
- Category management
- Budget settings
- Export data functionality
- About section

## 📚 Препоръчителен ред на разработка

1. **Първо**: Завърши Scanner → ReceiptReview → Запазване в DB
2. **Второ**: History screen с real data и navigation към detail
3. **Трето**: Dashboard с real statistics
4. **Четвърто**: Statistics с графики
5. **Пето**: Settings и допълнителни функции

## 🔑 Важни бележки

### Environment Setup
Не забравяйте да създадете `.env` файл:
```bash
EXPO_PUBLIC_CLAUDE_API_KEY=your_api_key_here
```

### Testing
За тестване на AI функционалността без да харчите API credits:
1. Създайте mock данни в Scanner screen
2. Skip Claude API call в development
3. Използвайте hardcoded test receipt data

### Database Initialization
При първо стартиране базата данни ще се създаде автоматично.
Можете да добавите seed data за testing в `DatabaseService.init()`.

## 📖 Полезни ресурси

- [React Native Docs](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Claude API Docs](https://docs.anthropic.com/)
- [React Native Chart Kit](https://github.com/indiespirit/react-native-chart-kit)

## 🐛 Debugging Tips

1. **Database issues**: Проверете с `adb shell` или iOS simulator console
2. **Claude API errors**: Логвайте full response за debugging
3. **Navigation**: Използвайте React Navigation DevTools
4. **Performance**: Използвайте React DevTools Profiler

## 🎯 Следващи Features (Phase 2)

- Export to CSV/PDF
- Budget management с notifications
- Receipt OCR offline fallback
- Multi-language support
- Dark theme
- Cloud backup
- Recurring expenses detection
- Split expenses with friends
