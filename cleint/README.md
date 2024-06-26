app/: Основные компоненты приложения
entities/: Модели и сущности (например, ChessPiece, Board)
features/: Отдельные функциональные модули (например, DragAndDrop, BoardSetup)
layouts/: Основные шаблоны и макеты
pages/: Страницы приложения
public/: Статические файлы
shared/: Общие компоненты и утилиты
widgets/: Вспомогательные виджеты
структура проекта
chess/
├── .nuxt/
├── .vscode/
├── app/
│   ├── App.vue
│   ├── main.ts
├── entities/
│   ├── chessPiece/
│   │   ├── model/
│   │   │   ├── ChessPiece.ts
│   │   │   └── index.ts
│   │   ├── ui/
│   │   │   └── ChessPiece.vue
│   │   └── index.ts
│   ├── board/
│   │   ├── model/
│   │   │   ├── Board.ts
│   │   │   └── index.ts
│   │   ├── ui/
│   │   │   └── Board.vue
│   │   └── index.ts
├── features/
│   ├── dragAndDrop/
│   │   ├── model/
│   │   │   └── DragAndDrop.ts
│   │   ├── ui/
│   │   │   └── DragAndDrop.vue
│   │   └── index.ts
│   ├── boardSetup/
│   │   ├── model/
│   │   │   └── BoardSetup.ts
│   │   ├── ui/
│   │   │   └── BoardSetup.vue
│   │   └── index.ts
├── layouts/
│   └── default.vue
├── pages/
│   ├── index.vue
│   └── game.vue
├── public/
├── shared/
│   ├── api/
│   │   └── api.ts
│   ├── config/
│   │   └── config.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── ui/
│   │   ├── Button.vue
│   │   └── Modal.vue
│   └── index.ts
├── widgets/
│   ├── scoreBoard/
│   │   ├── model/
│   │   │   └── ScoreBoard.ts
│   │   ├── ui/
│   │   │   └── ScoreBoard.vue
│   │   └── index.ts
├── .gitignore
├── .npmrc
├── eslint.config.js
├── nuxt.config.ts
├── package-lock.json
├── package.json
├── README.md
├── tsconfig.json
└── uno.config.ts

find . -type d \( -name ".nuxt" -o -name ".vscode" -o -name "node_modules" -o -name ".git" \) -prune -o -print
для вывода в терминал структуры проекта
