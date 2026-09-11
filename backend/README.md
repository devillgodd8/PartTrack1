# PartTrack — PHP Backend

This is the PHP backend implementation for **PartTrack**, replacing the previous Node.js server with 100% endpoint and schema parity.

## Features
- **Zero External Dependencies**: Pure PHP 8.0+ implementation using native PDO, Bcrypt, and HMAC-SHA256 JWT.
- **Database Flexibility**: Native SQLite support out-of-the-box (at `backend/data/parttrack.db`) or PostgreSQL (via `DATABASE_URL` e.g. Supabase).
- **Authentication**: JWT stored in `httpOnly` secure cookies, with role-based access control (`admin`, `user`).
- **External Integration**: Scoped API keys (`pt_live_...`) for public tracking lookups at `/api/v1/track`.
- **Transactional Emails**: Native SMTP client with HTML templates for email verification (OTP) and password reset, with console fallback for local development.

---

## Getting Started

### 1. Configure Environment
Copy `.env.example` to `.env` if you haven't already:
```bash
cp .env.example .env
```
Ensure your `JWT_SECRET` is set to a secure string.

### 2. Run Migrations & Seeder
Initialize the database tables and default admin user:
```bash
php bin/migrate.php
php bin/seed.php
```

Default credentials created by seeder:
- **Email**: `admin@parttrack.local`
- **Password**: `ChangeMe123!`

### 3. Start Development Server
Run the built-in PHP development server on port **5000**:
```bash
php -S localhost:5000 index.php
```
The React frontend dev server (Vite on port 5173) will automatically proxy `/api/*` requests to `http://localhost:5000`.

---

## Production Deployment

### Apache
An `.htaccess` file is included in `backend/` with mod_rewrite configured to route all incoming API requests through `index.php`. Ensure `mod_rewrite` and `mod_headers` are enabled.

### Nginx
Example Nginx configuration block:
```nginx
location /api/ {
    try_files $uri $uri/ /backend/index.php?$query_string;
}

location ~ \.php$ {
    include fastcgi_params;
    fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```
