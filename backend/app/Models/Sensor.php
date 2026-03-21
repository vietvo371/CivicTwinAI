<?php

namespace App\Models;

use App\Traits\HasTranslatedEnums;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Sensor extends Model
{
    use SoftDeletes, HasTranslatedEnums;

    protected $fillable = [
        'sensor_code', 'edge_id', 'type', 'model', 'firmware_version',
        'status', 'last_active_at', 'metadata', 'installed_at',
    ];

    protected static array $translatedEnums = [
        'type'   => 'sensor_type',
        'status' => 'sensor_status',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'last_active_at' => 'datetime',
            'installed_at' => 'datetime',
        ];
    }

    public function edge(): BelongsTo
    {
        return $this->belongsTo(Edge::class);
    }
}
