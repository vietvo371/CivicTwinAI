<?php

namespace Tests\Feature;

use App\Jobs\CallAIPrediction;
use App\Models\Incident;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class IncidentApiTest extends TestCase
{
    use RefreshDatabase;

    private User $operator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->operator = User::factory()->create(['is_active' => true]);
    }

    public function test_can_list_incidents(): void
    {
        Incident::factory()->count(3)->create();

        $response = $this->actingAs($this->operator)
            ->getJson('/api/incidents');

        $response->assertOk();
    }

    public function test_can_create_incident_low_severity(): void
    {
        $response = $this->actingAs($this->operator)
            ->postJson('/api/incidents', [
                'title' => 'Thi công trên Nguyễn Trãi',
                'type' => 'construction',
                'severity' => 'low',
                'source' => 'operator',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'Thi công trên Nguyễn Trãi');

        $this->assertDatabaseHas('incidents', [
            'title' => 'Thi công trên Nguyễn Trãi',
            'severity' => 'low',
        ]);
    }

    public function test_create_high_severity_dispatches_ai_job(): void
    {
        Bus::fake();

        $response = $this->actingAs($this->operator)
            ->postJson('/api/incidents', [
                'title' => 'Tai nạn trên Điện Biên Phủ',
                'type' => 'accident',
                'severity' => 'high',
                'source' => 'operator',
            ]);

        $response->assertCreated();
        Bus::assertDispatched(CallAIPrediction::class);
    }

    public function test_create_incident_validation(): void
    {
        $response = $this->actingAs($this->operator)
            ->postJson('/api/incidents', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'type', 'severity', 'source']);
    }

    public function test_can_show_incident(): void
    {
        $incident = Incident::factory()->create();

        $response = $this->actingAs($this->operator)
            ->getJson("/api/incidents/{$incident->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $incident->id);
    }

    public function test_can_update_incident_status(): void
    {
        $incident = Incident::factory()->create(['status' => 'open']);

        $response = $this->actingAs($this->operator)
            ->patchJson("/api/incidents/{$incident->id}", [
                'status' => 'investigating',
            ]);

        $response->assertOk();
        $this->assertEquals('investigating', $incident->fresh()->status);
    }

    public function test_resolving_sets_resolved_at(): void
    {
        $incident = Incident::factory()->create(['status' => 'open']);

        $this->actingAs($this->operator)
            ->patchJson("/api/incidents/{$incident->id}", [
                'status' => 'resolved',
            ]);

        $this->assertNotNull($incident->fresh()->resolved_at);
    }

    public function test_can_filter_by_status(): void
    {
        Incident::factory()->create(['status' => 'open']);
        Incident::factory()->create(['status' => 'closed']);

        $response = $this->actingAs($this->operator)
            ->getJson('/api/incidents?status=open');

        $response->assertOk();
    }

    public function test_unauthenticated_cannot_access(): void
    {
        $this->getJson('/api/incidents')->assertUnauthorized();
        $this->postJson('/api/incidents', [])->assertUnauthorized();
    }
}
