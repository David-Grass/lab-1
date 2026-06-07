# ЛР5 – REST API + SQLite + Security (варіант 6)

> **ЛР5:** параметризований SQL, IDOR-захист (`X-Demo-UserId`), security headers.  
> Звіт: [`../LAB5-REPORT.md`](../LAB5-REPORT.md) · Приклади: [`requests.http`](requests.http)  
> **Тег:** `0.5.0`

## 5.1. Запуск

```powershell
cd lab2-api
npm.cmd run seed
npm.cmd run dev

cd ../lab1_frontend
npm.cmd run dev
```

Фронт: http://localhost:5173 · API: http://localhost:3000/api/v1

**IDOR:** захищені `GET/PATCH/DELETE /reports/:id` — потрібен заголовок `X-Demo-UserId: 1|2`.  
На фронтенді — селект «Поточний користувач».

---

# ЛР4 – REST API + SQLite + CORS (варіант 6)

> **ЛР4:** фронтенд у `../lab1_frontend/` (TypeScript, fetch). API доступне на **`/api/v1/...`** і **`/api/...`**. CORS дозволяє `http://localhost:5173` та `:5500`.

## 4.1. Запуск разом з фронтендом

```powershell
# API
cd lab2-api
npm install
npm run seed
npm run dev

# Frontend (інший термінал)
cd ../lab1_frontend
npm install
npm run dev
```

Фронт: http://localhost:5173 · API: http://localhost:3000/api/v1/reports

---

## Структура проєкту

```
lab2-api/
├── data/
│   └── app.db              ← файл БД (створюється автоматично, не в git)
├── migrations/             ← SQL-міgraції (001_..., 002_..., один файл = один SQL)
│   ├── 001_create_users.sql
│   ├── 002_create_reports.sql
│   └── ...
├── scripts/
│   └── seed.ts             ← тестові дані (npm run seed)
└── src/
    ├── index.ts            ← запуск сервера (bootstrap: initDb → listen)
    ├── app.ts              ← Express, middleware, routes
    ├── routes/             ← HTTP-маршрути (без SQL)
    ├── controllers/        ← приймають запит, викликають service
    ├── services/           ← бізнес-логіка
    ├── repositories/       ← SQL-запити до SQLite
    ├── db/
    │   ├── db.ts           ← шлях до app.db
    │   ├── dbClient.ts     ← run / get / all (підключення)
    │   ├── migrate.ts      ← застосування migrations/
    │   ├── initDb.ts       ← migrate + відкрити БД
    │   └── sql.ts          ← допоміжні функції для SQL-рядків
    ├── dtos/               ← типи запитів/відповідей + валідація
    └── middleware/         ← логування, error handler
```

## 3.1. Запуск

```bash
cd lab2-api
npm install
npm run seed    # тестові дані (5–20 рядків) — вимога методички
npm run dev
```

API: http://localhost:3000

**Що відбувається при старті (`npm run dev`):**

1. `initDb()` → `migrate()` застосовує файли з `migrations/`
2. відкривається `data/app.db`
3. сервер слухає порт 3000

**Перевірка API** — curl-приклади в розділі 3.4 нижче (як у методичці).

База даних зберігається у `data/app.db` (файл не потрапляє в git).

Якщо БД «зламана» або стара — видали файл і почни знову:

```bash
# PowerShell
Remove-Item data/app.db
npm run seed
npm run dev
```

Додатково:

```bash
npm run build   # компіляція TypeScript → dist/
npm run start   # запуск зібраної версії
npm run lint    # перевірка ESLint
npm run format  # форматування Prettier
```

## 3.2. Схема бази даних

### Users

| Поле    | Тип     | Обмеження                             |
| ------- | ------- | ------------------------------------- |
| `id`    | INTEGER | PRIMARY KEY                           |
| `name`  | TEXT    | NOT NULL, CHECK (довжина ≥ 2)         |
| `email` | TEXT    | NOT NULL, UNIQUE, CHECK (містить `@`) |

### Reports

| Поле          | Тип     | Обмеження                                 |
| ------------- | ------- | ----------------------------------------- |
| `id`          | INTEGER | PRIMARY KEY                               |
| `userId`      | INTEGER | NOT NULL, FK → Users(id)                  |
| `title`       | TEXT    | NOT NULL, CHECK (довжина ≥ 3)             |
| `severity`    | TEXT    | CHECK: Low, Medium, High, Critical        |
| `status`      | TEXT    | CHECK: Open, InProgress, Resolved, Closed |
| `description` | TEXT    | NOT NULL, CHECK (довжина ≥ 10)            |

Унікальний індекс: `(lower(trim(title)), userId)` — один автор не може мати два репорти з однаковою назвою.

### ReportComments

| Поле       | Тип     | Обмеження                                    |
| ---------- | ------- | -------------------------------------------- |
| `id`       | INTEGER | PRIMARY KEY                                  |
| `reportId` | INTEGER | NOT NULL, FK → Reports(id) ON DELETE CASCADE |
| `userId`   | INTEGER | NOT NULL, FK → Users(id)                     |
| `body`     | TEXT    | NOT NULL, CHECK (1–1000 символів)            |

### schema_migrations

Таблиця обліку застосованих міграцій (`filename`, `appliedAt`).

Увімкнено `PRAGMA foreign_keys = ON`.

## 3.3. Реалізовані сутності та ендпойнти

| Сутність           | Маршрут         | Опис                               |
| ------------------ | --------------- | ---------------------------------- |
| **Users**          | `/api/users`    | CRUD + фільтр/сортування/пагінація |
| **Reports**        | `/api/reports`  | CRUD + фільтр/сортування/пагінація |
| **ReportComments** | `/api/comments` | CRUD + фільтр за reportId/userId   |

Додаткові ендпойнти Reports:

- `GET /api/reports/with-authors` — список репортів з JOIN (ім’я та email автора)
- `GET /api/reports/stats` — агрегація: COUNT за severity/status, AVG коментарів на репорт
- `GET /api/reports/search?q=...` — **навмисно небезпечний** пошук (конкатенація рядка в `LIKE` без параметризації; для демонстрації SQLi в ЛР5)

Формат списків: `{ "data": [...], "meta": { "total", "page", "pageSize" } }`.

### SQL-ін'єкція (для ЛР5)

Ендпойнт `/api/reports/search` формує запит конкатенацією:

```sql
WHERE r.title LIKE '%<ввід користувача>%'
```

Приклад payload: `q=' OR '1'='1` — поверне всі репорти. У продакшені потрібні параметризовані запити (`?`).

## 3.4. Приклади запитів (curl)

### Users

```bash
curl -i http://localhost:3000/api/users

curl -i -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"David Hrass\",\"email\":\"david@example.com\"}"

curl -i "http://localhost:3000/api/users?search=david&sortBy=name&sortDir=asc&page=1&pageSize=10"

curl -i http://localhost:3000/api/users/1
```

### Reports

```bash
curl -i http://localhost:3000/api/reports

curl -i http://localhost:3000/api/reports/with-authors?severity=High

curl -i http://localhost:3000/api/reports/stats

curl -i "http://localhost:3000/api/reports/search?q=xss"

curl -i -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d "{\"userId\":1,\"title\":\"XSS у формі коментарів\",\"severity\":\"High\",\"status\":\"Open\",\"description\":\"Можна вставити script-тег у поле коментаря\"}"

curl -i "http://localhost:3000/api/reports?severity=High&status=Open&search=xss&sortBy=id&sortDir=desc&page=1&pageSize=10"

curl -i http://localhost:3000/api/reports/1
```

### ReportComments

```bash
curl -i http://localhost:3000/api/comments

curl -i "http://localhost:3000/api/comments?reportId=1&sortBy=id&sortDir=asc"

curl -i -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d "{\"reportId\":1,\"userId\":2,\"body\":\"Підтверджую вразливість.\"}"

curl -i http://localhost:3000/api/comments/1
```
