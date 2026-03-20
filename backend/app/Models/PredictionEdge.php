<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PredictionEdge extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'prediction_id', 'edge_id', 'time_horizon_minutes',
        'predicted_density', 'predicted_delay_s', 'confidence', 'severity',
    ];

    protected function casts(): array
    {
        return [
            'predicted_density' => 'decimal:4',
            'confidence' => 'decimal:2',
        ];
    }

    public function prediction(): BelongsTo
    {
        return $this->belongsTo(Prediction::class);
    }

    public function edge(): BelongsTo
    {
        return $this->belongsTo(Edge::class);
    }
}
