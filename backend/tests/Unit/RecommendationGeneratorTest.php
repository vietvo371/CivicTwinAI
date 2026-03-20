<?php

namespace Tests\Unit;

use App\Services\RecommendationGenerator;
use App\Models\Incident;
use App\Models\Prediction;
use App\Models\PredictionEdge;
use App\Models\Recommendation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecommendationGeneratorTest extends TestCase
{
    use RefreshDatabase;

    private RecommendationGenerator $generator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->generator = new RecommendationGenerator();
    }

    public function test_generates_priority_route_and_alert_for_critical_severity(): void
    {
        $incident = Incident::factory()->create(['severity' => 'critical']);
        $prediction = Prediction::factory()->create([
            'incident_id' => $incident->id,
            'status' => 'completed',
        ]);
        PredictionEdge::factory()->create([
            'prediction_id' => $prediction->id,
            'confidence' => 0.85,
            'severity' => 'critical',
        ]);

        $this->generator->generate($prediction);

        $recs = Recommendation::where('prediction_id', $prediction->id)->get();
        $this->assertCount(2, $recs);
        $this->assertTrue($recs->contains('type', 'priority_route'));
        $this->assertTrue($recs->contains('type', 'alert'));
    }

    public function test_generates_reroute_and_alert_for_high_severity(): void
    {
        $incident = Incident::factory()->create(['severity' => 'high']);
        $prediction = Prediction::factory()->create([
            'incident_id' => $incident->id,
            'status' => 'completed',
        ]);
        PredictionEdge::factory()->create([
            'prediction_id' => $prediction->id,
            'confidence' => 0.75,
            'severity' => 'high',
        ]);

        $this->generator->generate($prediction);

        $recs = Recommendation::where('prediction_id', $prediction->id)->get();
        $this->assertCount(2, $recs);
        $this->assertTrue($recs->contains('type', 'reroute'));
        $this->assertTrue($recs->contains('type', 'alert'));
    }

    public function test_generates_reroute_only_for_medium_severity(): void
    {
        $incident = Incident::factory()->create(['severity' => 'medium']);
        $prediction = Prediction::factory()->create([
            'incident_id' => $incident->id,
            'status' => 'completed',
        ]);
        PredictionEdge::factory()->create([
            'prediction_id' => $prediction->id,
            'confidence' => 0.65,
            'severity' => 'medium',
        ]);

        $this->generator->generate($prediction);

        $recs = Recommendation::where('prediction_id', $prediction->id)->get();
        $this->assertCount(1, $recs);
        $this->assertEquals('reroute', $recs->first()->type);
    }

    public function test_no_recommendations_when_low_confidence(): void
    {
        $incident = Incident::factory()->create(['severity' => 'high']);
        $prediction = Prediction::factory()->create([
            'incident_id' => $incident->id,
            'status' => 'completed',
        ]);
        PredictionEdge::factory()->create([
            'prediction_id' => $prediction->id,
            'confidence' => 0.3,
            'severity' => 'low',
        ]);

        $this->generator->generate($prediction);

        $this->assertCount(0, Recommendation::where('prediction_id', $prediction->id)->get());
    }
}
