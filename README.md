# X5 Вайб-стенд

**Отдельный продукт** — корпоративный стенд прототипов. Не связан с монорепозиторием X5 Hub.

- Без логина (закрытая сеть)
- Импорт проектов из **GitLab**
- Каждый прототип на **своём поддомене** (`tracker.localhost:3002` / `tracker.proto.x5.ru`)
- Деплой на сервер инфра (не Pink)

## Запуск

```powershell
git clone https://github.com/bakzzz/x5-vibe-stand.git
cd x5-vibe-stand
copy .env.example .env
npm install
npm run db:init
npm run dev
```

| Сервис | URL |
|--------|-----|
| Реестр | http://localhost:3002/ |
| API | http://localhost:8013/api/health |

## GitLab → прототип

1. **Импорт GitLab** в UI (slug + URL репозитория)
2. `git clone` / `pull` → `data/proto-repos/<slug>`
3. Копия `proto/` → `src/features/<slug>/proto/`
4. Открыть http://`<slug>`.localhost:3002/

CLI: `npm run proto:sync -- tracker https://gitlab.com/.../x5-proto-tracker`

Структура repo прототипа: `proto/v1/*ShellRoot.tsx` (FSD).

## Сборка (сервер Ивана)

```powershell
npm run build
$env:NODE_ENV="production"
npm start
```

Статика в `dist/`, API отдаёт SPA в production.

## Переменные `.env`

См. `.env.example` — префикс `STAND_*`, БД `data/stand.db`.

## Node

Требуется **Node.js 22+** (`engines` в `package.json`).
