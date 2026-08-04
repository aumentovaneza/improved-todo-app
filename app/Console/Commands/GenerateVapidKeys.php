<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeys extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'webpush:vapid';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate a VAPID keypair for Web Push and print the values for your .env';

    /**
     * Execute the console command.
     *
     * VAPID keys authenticate this application server to browser push services.
     * We only generate and print them — the operator copies the pair into .env
     * (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) so the private key never touches
     * version control. Re-running rotates the pair, which invalidates existing
     * browser subscriptions, so only regenerate deliberately.
     */
    public function handle(): int
    {
        $keys = VAPID::createVapidKeys();

        $this->info('VAPID keypair generated. Add these to your .env (keep the private key secret):');
        $this->newLine();
        $this->line('VAPID_PUBLIC_KEY="'.$keys['publicKey'].'"');
        $this->line('VAPID_PRIVATE_KEY="'.$keys['privateKey'].'"');
        $this->newLine();
        $this->warn('Regenerating rotates the keys and invalidates all existing browser subscriptions.');

        return self::SUCCESS;
    }
}
