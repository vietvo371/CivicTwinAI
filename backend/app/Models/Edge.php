<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Edge extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'source_node_id', 'target_node_id', 'length_m', 'lanes',
        'speed_limit_kmh', 'direction', 'road_type',
        'current_density', 'current_speed_kmh', 'current_flow',
        'congestion_level', 'status', 'metrics_updated_at',
    ];

    protected function casts(): array
    {
        return [
            'length_m' => 'decimal:2',
            'current_density' => 'decimal:4',
            'current_speed_kmh' => 'decimal:2',
            'current_flow' => 'decimal:2',
            'metrics_updated_at' => 'datetime',
        ];
    }

    public function sourceNode(): BelongsTo
    {
        return $this->belongsTo(Node::class, 'source_node_id');
    }

    public function targetNode(): BelongsTo
    {
        return $this->belongsTo(Node::class, 'target_node_id');
    }

    public function sensors(): HasMany
    {
        return $this->hasMany(Sensor::class);
    }

    public function predictionEdges(): HasMany
    {
        return $this->hasMany(PredictionEdge::class);
    }
}
