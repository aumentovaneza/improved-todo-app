<?php

namespace App\Modules\Journal;

use App\Modules\Journal\Repositories\Contracts\JournalEntryRepositoryInterface;
use App\Modules\Journal\Repositories\Contracts\JournalTagRepositoryInterface;
use App\Modules\Journal\Repositories\Eloquent\JournalEntryRepository;
use App\Modules\Journal\Repositories\Eloquent\JournalTagRepository;
use Illuminate\Support\ServiceProvider;

class JournalServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(JournalEntryRepositoryInterface::class, JournalEntryRepository::class);
        $this->app->bind(JournalTagRepositoryInterface::class, JournalTagRepository::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/routes.php');
        $this->loadMigrationsFrom(__DIR__.'/database/migrations');
    }
}
