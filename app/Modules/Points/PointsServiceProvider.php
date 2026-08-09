<?php

namespace App\Modules\Points;

use App\Models\Subtask;
use App\Models\Task;
use App\Modules\Points\Observers\PointsSubtaskObserver;
use App\Modules\Points\Observers\PointsTaskObserver;
use App\Modules\Points\Repositories\Contracts\PointLedgerRepositoryInterface;
use App\Modules\Points\Repositories\Contracts\PointWalletRepositoryInterface;
use App\Modules\Points\Repositories\Contracts\PomodoroSessionRepositoryInterface;
use App\Modules\Points\Repositories\Contracts\StoreItemRepositoryInterface;
use App\Modules\Points\Repositories\Contracts\UserAvatarRepositoryInterface;
use App\Modules\Points\Repositories\Contracts\UserStoreItemRepositoryInterface;
use App\Modules\Points\Repositories\Eloquent\PointLedgerRepository;
use App\Modules\Points\Repositories\Eloquent\PointWalletRepository;
use App\Modules\Points\Repositories\Eloquent\PomodoroSessionRepository;
use App\Modules\Points\Repositories\Eloquent\StoreItemRepository;
use App\Modules\Points\Repositories\Eloquent\UserAvatarRepository;
use App\Modules\Points\Repositories\Eloquent\UserStoreItemRepository;
use Illuminate\Support\ServiceProvider;

class PointsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PointWalletRepositoryInterface::class, PointWalletRepository::class);
        $this->app->bind(PointLedgerRepositoryInterface::class, PointLedgerRepository::class);
        $this->app->bind(StoreItemRepositoryInterface::class, StoreItemRepository::class);
        $this->app->bind(UserStoreItemRepositoryInterface::class, UserStoreItemRepository::class);
        $this->app->bind(UserAvatarRepositoryInterface::class, UserAvatarRepository::class);
        $this->app->bind(PomodoroSessionRepositoryInterface::class, PomodoroSessionRepository::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/routes.php');
        $this->loadMigrationsFrom(__DIR__.'/database/migrations');

        Task::observe(PointsTaskObserver::class);
        Subtask::observe(PointsSubtaskObserver::class);
    }
}
