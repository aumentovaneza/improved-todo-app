<?php

namespace Tests\Feature\Admin;

use App\Mail\TestToolEmail;
use App\Models\DailySummary;
use App\Models\User;
use App\Modules\Finance\Models\FinanceInsight;
use App\Notifications\TestNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ToolsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin']);
    }

    public function test_member_cannot_access_tools_page(): void
    {
        $user = User::factory()->create(['role' => 'member']);

        $this->actingAs($user)->get('/admin/tools')->assertStatus(403);
    }

    public function test_admin_can_access_tools_page(): void
    {
        $this->actingAs($this->admin())->get('/admin/tools')->assertStatus(200);
    }

    public function test_member_cannot_use_tool_actions(): void
    {
        $user = User::factory()->create(['role' => 'member']);

        $this->actingAs($user)
            ->post('/admin/tools/test-email', ['email' => 'x@example.com'])
            ->assertStatus(403);
    }

    public function test_admin_can_send_test_email(): void
    {
        Mail::fake();

        $this->actingAs($this->admin())
            ->post('/admin/tools/test-email', ['email' => 'target@example.com'])
            ->assertRedirect();

        Mail::assertSent(TestToolEmail::class, fn ($mail) => $mail->hasTo('target@example.com'));
    }

    public function test_test_email_requires_valid_address(): void
    {
        Mail::fake();

        $this->actingAs($this->admin())
            ->post('/admin/tools/test-email', ['email' => 'not-an-email'])
            ->assertSessionHasErrors('email');

        Mail::assertNothingSent();
    }

    public function test_admin_can_send_test_notification(): void
    {
        Notification::fake();

        $target = User::factory()->create();

        $this->actingAs($this->admin())
            ->post('/admin/tools/test-notification', ['user_id' => $target->id])
            ->assertRedirect();

        Notification::assertSentTo($target, TestNotification::class);
    }

    public function test_admin_can_clear_daily_summary_for_a_user(): void
    {
        $target = User::factory()->create();
        $other = User::factory()->create();

        DailySummary::factory()->create(['user_id' => $target->id]);
        DailySummary::factory()->create(['user_id' => $other->id]);

        $this->actingAs($this->admin())
            ->post('/admin/tools/clear-daily-summary', ['user_id' => $target->id])
            ->assertRedirect();

        $this->assertDatabaseMissing('daily_summaries', ['user_id' => $target->id]);
        $this->assertDatabaseHas('daily_summaries', ['user_id' => $other->id]);
    }

    public function test_admin_can_clear_spending_insights_for_a_user(): void
    {
        $target = User::factory()->create();
        $other = User::factory()->create();

        $this->makeInsight($target->id);
        $this->makeInsight($other->id);

        $this->actingAs($this->admin())
            ->post('/admin/tools/clear-spending-insights', ['user_id' => $target->id])
            ->assertRedirect();

        $this->assertDatabaseMissing('finance_insights', ['user_id' => $target->id]);
        $this->assertDatabaseHas('finance_insights', ['user_id' => $other->id]);
    }

    private function makeInsight(int $userId): FinanceInsight
    {
        return FinanceInsight::create([
            'user_id' => $userId,
            'period_start' => now()->startOfMonth()->toDateString(),
            'period_end' => now()->endOfMonth()->toDateString(),
            'range' => 'month',
            'content' => 'Test insight',
            'provider' => 'anthropic',
            'model' => 'claude-sonnet-5',
            'generated_at' => now(),
        ]);
    }
}
