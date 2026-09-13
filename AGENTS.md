# Repository Guidelines

## Project Structure & Module Organization
- **`.\frontend\`**: React 19 SPA built with Vite and Tailwind CSS v3. Route pages reside in `.\frontend\src\pages\` (with `admin/` and `user/` subdirectories), API bindings in `.\frontend\src\api\`, and global auth state in `.\frontend\src\context\AuthContext.jsx`.
- **`.\backend\backend\`**: Pure PHP 8+ REST backend using native PDO and HMAC-SHA256 JWT auth without external composer dependencies. Entry router is `.\backend\backend\index.php`, controllers in `.\backend\backend\controllers\`, middleware in `.\backend\backend\middleware\`, and database configuration supporting SQLite, PostgreSQL (Supabase pooler on port 6543), and MySQL in `.\backend\backend\config\database.php`.
- **`.\scripts\build.js` & `.\vercel.json`**: Root orchestration build script and Vercel configuration routing `/api/(.*)` to remote deployment or local server and static assets to `.\frontend\dist\`.

## Build, Test, and Development Commands
- **Root build**: `npm run build` (executes `node scripts/build.js` to install dependencies and build frontend)
- **Frontend dev server**: `npm --prefix frontend run dev`
- **Frontend build**: `npm --prefix frontend run build`
- **Frontend lint**: `npm --prefix frontend run lint` (runs `oxlint`)
- **Frontend preview**: `npm --prefix frontend run preview`
- **Backend database migrations**: `php bin/migrate.php` (run inside `.\backend\backend\`)
- **Backend seed initial admin**: `php bin/seed.php` (run inside `.\backend\backend\`)
- **Backend dev server**: `php -S localhost:5000 index.php` (run inside `.\backend\backend\`)

## Coding Style & Naming Conventions
- **Frontend**: Linting is enforced via `oxlint` with rules defined in `.\frontend\.oxlintrc.json` (`react/rules-of-hooks` and `react/only-export-components`). Use JSX components named in `PascalCase` and Tailwind utility classes utilizing the custom `brand` and `surface` color palettes in `.\frontend\tailwind.config.js`.
- **Backend**: Native PHP classes follow `PascalCase` naming for controllers (`*Controller.php`), middleware (`*Middleware.php`), and services (`*Service.php`). Database interaction uses prepared PDO statements with parameter binding.

## Testing Guidelines
- No automated testing suites (e.g. Vitest, Jest, PHPUnit) are currently configured. Validate changes via `npm --prefix frontend run lint` and `npm run build`.

## Commit & Pull Request Guidelines
- Commit messages follow concise, imperative sentences summarizing the change (e.g., `Fix database connection: support Supabase pooler port 6543`, `Enhance health check and expose diagnostic errors`).
