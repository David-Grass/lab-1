# ЛР5 – Frontend (TypeScript + безпечний рендер)

**Варіант 6:** XSS-захист (DOM API + `textContent`), demo user для IDOR.

> Звіт: [`../LAB5-REPORT.md`](../LAB5-REPORT.md) · **Тег:** `0.5.0`

## ЛР5 — що змінилось

- Селект **«Поточний користувач»** → заголовок `X-Demo-UserId`
- Рендер таблиці/деталей/коментарів через **createElement + textContent** (без `innerHTML`)
- Коментарі в панелі «Деталі» (демонстрація stored XSS fix)

---

# ЛР4 – Frontend (TypeScript + fetch)

**Варіант 6:** інтеграція UI з `lab2-api` через `/api/v1`.

## Запуск

Потрібні **два термінали**:

```powershell
# Термінал 1 — API
$env:Path = "D:\nodejs;" + $env:Path
cd lab2-api
npm.cmd install
npm.cmd run seed
npm.cmd run dev

# Термінал 2 — фронтенд
cd lab1_frontend
npm.cmd install
npm.cmd run dev
```

- API: http://localhost:3000  
- Frontend: http://localhost:5173  

> Не відкривай `index.html` подвійним кліком (`file://`) — потрібен dev-сервер Vite.

## Структура

```
lab1_frontend/
  index.html
  styles.css
  src/
    config.ts       — API_BASE_URL
    dtos.ts         — типи DTO
    apiClient.ts    — fetch + помилки + AbortController
    validation.ts   — клієнтська валідація
    ui.ts           — DOM
    main.ts         — сценарії
```

## Реалізовано (ЛР4)

- `fetch()` до `/api/v1/reports`, `/api/v1/users`
- Стани UI: loading / success / empty / error
- CRUD репортів (POST, PATCH, DELETE)
- Фільтри, сортування, пагінація через query API
- `apiClient` — єдине місце для HTTP
- Обробка `{ error: { code, message, details } }`
- CORS whitelist на бекенді
- TypeScript + таймаут/скасування запиту (15 с)

