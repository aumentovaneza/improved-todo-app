# Docker Setup Guide

This project is fully dockerized and ready to run with Docker Compose.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine + Docker Compose (Linux)
- At least 4GB of available RAM
- Ports 8000, 3306, and 6379 available (or configure different ports)

## Quick Start

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd improved-todo-app
   ```

2. **Create a `.env` file** (if it doesn't exist):
   ```bash
   cp .env.example .env
   ```
   
   Or create one with these minimum required variables:
   ```env
   APP_NAME="Wevie"
   APP_ENV=local
   APP_KEY=
   APP_DEBUG=true
   APP_URL=http://localhost:8000
   
   DB_CONNECTION=mysql
   DB_HOST=mysql
   DB_PORT=3306
   DB_DATABASE=todo_app
   DB_USERNAME=todo_user
   DB_PASSWORD=todo_password
   
   REDIS_HOST=redis
   REDIS_PORT=6379
   
   CACHE_DRIVER=redis
   SESSION_DRIVER=redis
   QUEUE_CONNECTION=redis
   ```

3. **Build and start the containers**:
   ```bash
   docker-compose up -d --build
   ```

4. **Access the application**:
   - Open your browser and navigate to `http://localhost:8000`
   - The application should be running!

## Services

The Docker Compose setup includes the following services:

- **app**: PHP-FPM application container (Laravel)
- **nginx**: Web server serving the application
- **mysql**: MySQL 8.0 database
- **redis**: Redis cache and session store
- **queue**: Laravel queue worker
- **scheduler**: Laravel task scheduler (cron)

## Environment Variables

You can customize the setup using environment variables in your `.env` file or by setting them before running docker-compose:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_PORT` | `8000` | Port for the web server |
| `DB_PORT` | `3306` | MySQL port |
| `REDIS_PORT` | `6379` | Redis port |
| `DB_DATABASE` | `todo_app` | Database name |
| `DB_USERNAME` | `todo_user` | Database user |
| `DB_PASSWORD` | `todo_password` | Database password |
| `DB_ROOT_PASSWORD` | `root_password` | MySQL root password |
| `APP_ENV` | `local` | Application environment |

## Common Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f mysql
```

### Execute commands in the app container
```bash
# Run artisan commands
docker-compose exec app php artisan migrate
docker-compose exec app php artisan tinker

# Run composer commands
docker-compose exec app composer install

# Run npm commands
docker-compose exec app npm install
docker-compose exec app npm run dev
```

### Access MySQL
```bash
docker-compose exec mysql mysql -u todo_user -ptodo_password todo_app
```

### Access Redis CLI
```bash
docker-compose exec redis redis-cli
```

### Rebuild containers
```bash
docker-compose up -d --build
```

### Stop and remove everything (including volumes)
```bash
docker-compose down -v
```

## Development Workflow

### Running in Development Mode

1. Start the containers:
   ```bash
   docker-compose up -d
   ```

2. Install dependencies (if needed):
   ```bash
   docker-compose exec app composer install
   docker-compose exec app npm install
   ```

3. Run migrations:
   ```bash
   docker-compose exec app php artisan migrate
   ```

4. For frontend development with hot reloading, you can run Vite outside Docker:
   ```bash
   npm run dev
   ```
   
   Or run it inside the container:
   ```bash
   docker-compose exec app npm run dev
   ```

### Running in Production Mode

1. Set `APP_ENV=production` in your `.env` file

2. Build and start:
   ```bash
   docker-compose up -d --build
   ```

3. The entrypoint script will automatically:
   - Install production dependencies
   - Build assets
   - Cache configuration
   - Run migrations

## Troubleshooting

### MySQL container fails with "MYSQL_USER='root'" error
**Problem**: MySQL doesn't allow creating a regular user named "root". The root user is special and must be configured via `MYSQL_ROOT_PASSWORD`.

**Solution**: Ensure your `.env` file has `DB_USERNAME` set to a non-root username:
```env
DB_USERNAME=todo_user  # ✅ Good
# DB_USERNAME=root     # ❌ This will cause MySQL to fail
```

If you need root access, use `DB_ROOT_PASSWORD` and connect directly as root, but keep `DB_USERNAME` as a regular user for the application.

### Port already in use
If you get port conflicts, change the ports in `docker-compose.yml` or set environment variables:
```bash
APP_PORT=8080 docker-compose up -d
```

### Permission issues
If you encounter permission issues with storage or cache:
```bash
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
docker-compose exec app chmod -R 775 storage bootstrap/cache
```

### Database connection errors
Make sure the MySQL service is healthy:
```bash
docker-compose ps
```
Wait a few seconds after starting for MySQL to initialize.

### Clear all caches
```bash
docker-compose exec app php artisan config:clear
docker-compose exec app php artisan route:clear
docker-compose exec app php artisan view:clear
docker-compose exec app php artisan cache:clear
```

### Reset database
```bash
docker-compose exec app php artisan migrate:fresh --seed
```

## Data Persistence

Data is persisted using Docker volumes:
- `mysql_data`: MySQL database files
- `redis_data`: Redis data

To remove all data:
```bash
docker-compose down -v
```

## Production Considerations

For production deployment:

1. Set strong passwords in `.env`
2. Set `APP_ENV=production` and `APP_DEBUG=false`
3. Use environment-specific configuration
4. Set up proper SSL/TLS (consider using a reverse proxy)
5. Configure proper backup strategies for volumes
6. Use Docker secrets or environment variable management
7. Consider using a production-ready image or multi-stage builds

## Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
