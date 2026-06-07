# ЛР2 – REST API (варіант 6)

## 3.1. Запуск

```bash
cd lab2-api
npm install
npm run dev
```

API: http://localhost:3000

Додатково:

```bash
npm run build   # компіляція TypeScript → dist/
npm run start   # запуск зібраної версії
npm run lint    # перевірка ESLint
npm run format  # форматування Prettier
```

## 3.2. Реалізовані сутності

| Сутність | Маршрут | Поля |
| -------- | ------- | ---- |
| **Users** | `/api/users` | `id`, `name`, `email` |
| **Reports** | `/api/reports` | `id`, `title`, `severity`, `status`, `description`, `reporter` |

**Users** — обов’язкова сутність (name, email).

**Reports** — доменна сутність варіанту 6 «Репорт вразливості»:

- `severity`: `Low`, `Medium`, `High`, `Critical`
- `status`: `Open`, `InProgress`, `Resolved`, `Closed`

Для обох сутностей: CRUD (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). Дані зберігаються в пам’яті (без БД).

## 3.3. Приклади запитів (curl)

### Users

```bash
curl -i http://localhost:3000/api/users

curl -i -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"David Hrass\",\"email\":\"david@example.com\"}"

curl -i http://localhost:3000/api/users/1

curl -i -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"David H.\",\"email\":\"david.h@example.com\"}"

curl -i -X PATCH http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"David H.\"}"

curl -i -X DELETE http://localhost:3000/api/users/1
```

### Reports

```bash
curl -i http://localhost:3000/api/reports

curl -i -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"XSS у формі коментарів\",\"severity\":\"High\",\"status\":\"Open\",\"description\":\"Можна вставити script-тег у поле коментаря\",\"reporter\":\"David\"}"

curl -i -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"ab\",\"severity\":\"High\",\"status\":\"Open\",\"description\":\"short\",\"reporter\":\"D\"}"

curl -i "http://localhost:3000/api/reports?severity=High&status=Open&search=xss&sortBy=id&sortDir=desc&page=1&pageSize=10"

curl -i http://localhost:3000/api/reports/1

curl -i -X PUT http://localhost:3000/api/reports/1 \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"XSS (fixed)\",\"severity\":\"Medium\",\"status\":\"InProgress\",\"description\":\"Проблема підтверджена командою безпеки\",\"reporter\":\"David\"}"

curl -i -X PATCH http://localhost:3000/api/reports/1 \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"Resolved\"}"

curl -i -X DELETE http://localhost:3000/api/reports/1

curl -i http://localhost:3000/api/reports/99999
```
