# ЛР5 — Звіт (варіант 6, «відмінно»)

**Студент:** David Hrass, KB-14  
**Проєкт:** `lab2-api` + `lab1_frontend`  
**Тег:** `0.5.0`  
**Попередня (уразлива) версія:** `0.4.0`

---

## Сценарій A — SQL Injection

### Було (0.4.0)
- SQL будувався конкатенацією (`sqlString`, підстановка `%${term}%` у `LIKE`).
- PoC: `GET /api/v1/reports/search?q=' OR '1'='1` повертав усі репорти.

### Виправлення
- `dbClient` підтримує параметри `?`.
- Усі репозиторії (`users`, `reports`, `comments`) переведені на параметризовані запити.
- `/reports/search` використовує `LIKE ?` замість конкатенації.

### Перевірка
```http
GET http://localhost:3000/api/v1/reports/search?q=' OR '1'='1
```
Очікування: повертається порожній список або лише рядки з літеральним текстом, **не** всі записи.

Нормальний пошук:
```http
GET http://localhost:3000/api/v1/reports/search?q=xss
```

---

## Сценарій B — XSS (stored)

### Було (0.4.0)
- UI рендерив дані через `innerHTML` (навіть з `escapeHtml` — не DOM API).
- У seed коментар: `<img src=x onerror="alert('XSS')">`.

### Виправлення
- `ui.ts`: `createElement` + `textContent` для таблиці, деталей і коментарів.
- Коментарі відображаються в панелі «Деталі» без інтерпретації HTML.

### Перевірка
1. Увійти як user id=1, відкрити репорт #1 → «Деталі».
2. Коментар з `<img...>` показується **як текст**, alert не спрацьовує.

---

## Сценарій V — IDOR (Broken Access Control)

### Було (0.4.0)
- `GET/PATCH/DELETE /api/v1/reports/:id` без перевірки власника.
- Будь-хто міг читати/редагувати чужий репорт за id.

### Виправлення
- Middleware `demoAuthMiddleware`: заголовок `X-Demo-UserId`.
- `assertReportOwner` у `access-control.service.ts` для read/update/delete.
- `userId` репорту = власник; create/update прив’язуються до `currentUserId`.

### Перевірка
```http
GET http://localhost:3000/api/v1/reports/1
X-Demo-UserId: 2
```
Очікування: **403 FORBIDDEN** (репорт #1 належить user 1).

```http
GET http://localhost:3000/api/v1/reports/1
X-Demo-UserId: 1
```
Очікування: **200 OK**.

На фронтенді: перемкнути «Поточний користувач» на Olena (id=2) і спробувати «Деталі» для репорту David → помилка доступу.

---

## Сценарій Г — Security Misconfiguration

### Було
- `X-Powered-By: Express` у відповіді.
- `details` у JSON-помилках завжди з dev-інформацією.

### Виправлення
- `securityHeadersMiddleware`: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- `app.disable("x-powered-by")`.
- У `NODE_ENV=production` поле `details` у помилках = `null`.
- CORS whitelist (localhost/127.0.0.1), заголовок `X-Demo-UserId` дозволений.

### Перевірка
```powershell
curl.exe -I http://localhost:3000/health
```
Перевірити наявність security headers.

```powershell
$env:NODE_ENV="production"
npm.cmd run dev
curl.exe http://localhost:3000/api/v1/reports/999 -H "X-Demo-UserId: 1"
```
У JSON помилки `details` має бути `null`.

---

## Таблиця «ризик → наслідок → виправлення»

| Ризик | Наслідок | Виправлення |
|-------|----------|-------------|
| SQLi у пошуку | Витік/зміна даних БД | Параметри `?` у SQLite |
| Stored XSS у коментарях | Виконання JS у браузері | `textContent` / DOM API |
| IDOR на Reports | Доступ до чужих репортів | `X-Demo-UserId` + перевірка `userId` |
| Dev-помилки / заголовки | Розкриття внутрішньої інформації | Security headers + sanitize errors |

---

## Запуск

```powershell
# API
cd lab2-api
npm.cmd run seed
npm.cmd run dev

# Frontend
cd ../lab1_frontend
npm.cmd run dev
```

Фронт: http://localhost:5173 · API: http://localhost:3000

Додаткові приклади запитів: `lab2-api/requests.http`
