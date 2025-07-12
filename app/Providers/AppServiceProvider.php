<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register Repository Interfaces
        $this->app->bind(
            \App\Repositories\Contracts\TaskRepositoryInterface::class,
            \App\Repositories\Eloquent\TaskRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\CategoryRepositoryInterface::class,
            \App\Repositories\Eloquent\CategoryRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\UserRepositoryInterface::class,
            \App\Repositories\Eloquent\UserRepository::class
        );

        $this->app->bind(
            \App\Repositories\Contracts\TagRepositoryInterface::class,
            \App\Repositories\Eloquent\TagRepository::class
        );

        // Register Services (no interfaces needed for services)
        $this->app->singleton(\App\Services\ReminderService::class);
        $this->app->singleton(\App\Services\SubtaskService::class);
        $this->app->singleton(\App\Services\GoogleCalendarService::class);
        $this->app->singleton(\App\Services\NotificationService::class);
        $this->app->singleton(\App\Services\SearchService::class);
        $this->app->singleton(\App\Services\ReportingService::class);

        // Phase 4: Performance & Optimization Services
        $this->app->singleton(\App\Services\CacheService::class);
        $this->app->singleton(\App\Services\QueueService::class);
        $this->app->singleton(\App\Services\DatabaseOptimizationService::class);
        $this->app->singleton(\App\Services\MonitoringService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
