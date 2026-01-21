#!/bin/sh

set -e

echo "Waiting for database connection..."
# Wait for MySQL to be ready using a simple connection test
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if php -r "
    try {
        \$pdo = new PDO(
            'mysql:host=${DB_HOST:-mysql};port=${DB_PORT:-3306}',
            '${DB_USERNAME:-todo_user}',
            '${DB_PASSWORD:-todo_password}',
            [PDO::ATTR_TIMEOUT => 2]
        );
        exit(0);
    } catch (Exception \$e) {
        exit(1);
    }
    " 2>/dev/null; then
        echo "Database is ready!"
        break
    fi
    
    attempt=$((attempt + 1))
    echo "Database is unavailable - attempt $attempt/$max_attempts - sleeping"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "Warning: Could not connect to database after $max_attempts attempts. Continuing anyway..."
fi

echo "Executing setup commands..."

# Fix permissions for storage and cache directories
echo "Setting up storage permissions..."
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/storage/framework/cache
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/bootstrap/cache
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Workaround for npm optional dependency bug on Alpine (musl)
ensure_rollup_binary() {
    if [ -f "node_modules/rollup/dist/native.js" ] && [ ! -d "node_modules/@rollup/rollup-linux-x64-musl" ]; then
        echo "Installing Rollup musl binary (optional dependency)..."
        npm install --no-save @rollup/rollup-linux-x64-musl || true
    fi
}

# Ensure Node dependencies are installed (vite present)
ensure_npm_dependencies() {
    local install_stamp="node_modules/.deps-installed"
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/vite" ]; then
        echo "Installing NPM dependencies..."
        npm install --include=optional || true
        touch "$install_stamp"
        ensure_rollup_binary
        return
    fi

    if [ ! -f "$install_stamp" ] \
        || [ "package.json" -nt "$install_stamp" ] \
        || [ -f "package-lock.json" -a "package-lock.json" -nt "$install_stamp" ]; then
        echo "Refreshing NPM dependencies (package update detected)..."
        npm install --include=optional || true
        touch "$install_stamp"
        ensure_rollup_binary
    fi
}

# Function to run setup in background
setup_app() {
    # Install dependencies if needed
    if [ ! -d "vendor" ] || [ ! -f "vendor/autoload.php" ]; then
        echo "Installing Composer dependencies (this may take a while for large packages)..."
        # Increase composer timeout to 600 seconds (10 minutes)
        export COMPOSER_PROCESS_TIMEOUT=600
        if [ "$APP_ENV" = "production" ]; then
            composer install --no-interaction --prefer-dist --no-dev --optimize-autoloader --no-scripts --timeout=600 || true
        else
            composer install --no-interaction --prefer-dist --no-scripts --timeout=600 || true
        fi
        composer dump-autoload --optimize || true
    fi

    ensure_npm_dependencies

    # Generate application key if not set
    if [ ! -f ".env" ] || ! grep -q "APP_KEY=" .env 2>/dev/null || grep -q "APP_KEY=$" .env 2>/dev/null; then
        echo "Generating application key..."
        php artisan key:generate --force || true
    fi

    # Run migrations (only if not already run)
    echo "Running migrations..."
    php artisan migrate --force || echo "Migrations may have already been run"

    # Cache configuration for production
    if [ "$APP_ENV" = "production" ]; then
        echo "Caching configuration for production..."
        php artisan config:cache || true
        php artisan route:cache || true
        php artisan view:cache || true
        
        # Build assets in production
        echo "Building production assets..."
        ensure_rollup_binary
        npm run build || true
    else
        echo "Clearing caches for development..."
        php artisan config:clear || true
        php artisan route:clear || true
        php artisan view:clear || true
    fi

    echo "Application setup completed!"
}

# Check if vendor directory exists and has autoload
if [ -d "vendor" ] && [ -f "vendor/autoload.php" ]; then
    echo "Dependencies already installed, starting immediately..."
    ensure_npm_dependencies
    # Run quick setup synchronously
    if [ ! -f ".env" ] || ! grep -q "APP_KEY=" .env 2>/dev/null || grep -q "APP_KEY=$" .env 2>/dev/null; then
        php artisan key:generate --force || true
    fi
    php artisan migrate --force || true
    
    # Build assets if manifest doesn't exist
    if [ ! -f "public/build/manifest.json" ]; then
        echo "Building assets (manifest not found)..."
        ensure_rollup_binary
        npm run build || true
    fi
    
    echo "Application is ready!"
    exec "$@"
else
    echo "Dependencies need installation, starting PHP-FPM and installing in background..."
    # Start setup in background
    setup_app &
    # Start PHP-FPM immediately
    exec "$@"
fi
