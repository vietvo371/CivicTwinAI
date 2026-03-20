<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Node extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'type', 'zone_id', 'has_traffic_light', 'metadata', 'status',
    ];

    protected function casts(): array
    {
        return [
            'has_traffic_light' => 'boolean',
            'metadata' => 'array',
        ];
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    public function outgoingEdges(): HasMany
    {
        return $this->hasMany(Edge::class, 'source_node_id');
    }

    public function incomingEdges(): HasMany
    {
        return $this->hasMany(Edge::class, 'target_node_id');
    }
}
