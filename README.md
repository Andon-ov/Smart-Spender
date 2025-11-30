# 💰 Smart Spender

Мобилно приложение за управление на лични финанси с AI технология за автоматично сканиране и анализ на касови бележки.

![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)
![Expo](https://img.shields.io/badge/Expo-54.0-000020)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Основни функционалности

- 📸 **Сканиране на бележки** - Заснемане или избор от галерия
- 🤖 **AI анализ** - Автоматично извличане на данни с Claude 3.5 Sonnet
- 📊 **Статистики** - Детайлни графики и анализи на разходите
- 🗂️ **Категоризация** - Автоматично разпределяне по категории
- 💾 **Локално съхранение** - SQLite база данни
- 📱 **iOS и Android** - Native приложение за двете платформи

## 🚀 Бърз старт

```bash
# Clone repository
git clone https://github.com/yourusername/Smart-Spender.git

# Навигирайте към проекта
cd Smart-Spender/smart-spender-app

# Инсталирайте dependencies
npm install

# Създайте .env файл
cp .env.example .env

# Добавете вашия Claude API key в .env
# EXPO_PUBLIC_CLAUDE_API_KEY=your_key_here

# Стартирайте приложението
npm start
```

## 📚 Документация

- 📖 [README](./smart-spender-app/README.md) - Пълна документация
- 🎯 [NEXT_STEPS](./smart-spender-app/NEXT_STEPS.md) - Следващи стъпки за развитие
- 📝 [PROJECT_SUMMARY](./smart-spender-app/PROJECT_SUMMARY.md) - Обобщение на проекта

## 🏗️ Архитектура

### Технологичен стек
- **Frontend**: React Native + Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs)
- **Database**: SQLite (expo-sqlite)
- **AI/OCR**: Claude 3.5 Sonnet API
- **UI**: React Native Paper + Custom components
- **Charts**: React Native Chart Kit

### Структура
```
smart-spender-app/
├── src/
│   ├── components/    # Reusable UI компоненти
│   ├── screens/       # Екрани на приложението
│   ├── services/      # API и database services
│   ├── navigation/    # Navigation setup
│   ├── types/         # TypeScript типове
│   ├── utils/         # Utility функции
│   ├── hooks/         # Custom React hooks
│   └── constants/     # Константи и theme
├── assets/            # Изображения и ресурси
└── App.tsx           # Entry point
```

## 🎨 Екрани

1. **Dashboard** - Преглед на разходи за месец/седмица/ден
2. **Scanner** - Сканиране на бележки с AI анализ
3. **History** - Списък с всички бележки
4. **Statistics** - Графики и детайлна статистика
5. **Settings** - Настройки и конфигурация

## 💾 База данни

SQLite схема с 4 таблици:
- `receipts` - Основна информация за бележките
- `items` - Отделни артикули от бележките
- `categories` - Категории разходи
- `budgets` - Месечни бюджети

## 🔐 Сигурност

- Всички данни се съхраняват локално на устройството
- API ключове са защитени чрез environment variables
- Няма изпращане на лични данни към външни сървъри (освен за AI анализ)

## 📱 Supported Platforms

- ✅ iOS 13+
- ✅ Android 6.0+
- ⚠️ Web (ограничена функционалност)

## 🛣️ Roadmap

### Phase 1: MVP ✅
- [x] Основна структура
- [x] Database setup
- [x] AI integration
- [x] Basic UI

### Phase 2: Core Features
- [ ] Пълна интеграция на Scanner с Claude
- [ ] Real data в Dashboard
- [ ] History с детайли
- [ ] Statistics с графики

### Phase 3: Advanced
- [ ] Budget management
- [ ] Export data (CSV, PDF)
- [ ] Notifications
- [ ] Dark theme
- [ ] Multi-language

### Phase 4: Cloud
- [ ] Cloud backup
- [ ] Multi-device sync
- [ ] User accounts

## 🤝 Contributing

Contributions са добре дошли! Моля, отворете issue или pull request.

## 📄 License

MIT License - вижте [LICENSE](LICENSE) файла за детайли.

## 👨‍💻 Author

Вашето име

## 🙏 Acknowledgments

- [Anthropic](https://www.anthropic.com/) за Claude API
- [Expo](https://expo.dev/) за отличните development tools
- React Native community

## 📞 Support

Ако имате въпроси или проблеми:
- 📧 Email: your.email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/Smart-Spender/issues)

---

⭐ Ако харесвате проекта, дайте звезда в GitHub!
