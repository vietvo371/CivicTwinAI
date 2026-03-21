<?php

namespace App\Models;

use App\Traits\HasTranslatedEnums;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prediction extends Model
{
    use HasFactory, HasTranslatedEnums;

    protected $fillable = [
        'incident_id', 'model_version', 'processing_time_ms', 'status', 'error_message',
    ];

    protected static array $translatedEnums = [
        'status' => 'prediction_status',
    ];

    public function incident(): BelongsTo
    {
        return $this->belongsTo(Incident::class);
    }

    public function predictionEdges(): HasMany
    {
        return $this->hasMany(PredictionEdge::class);
    }

    public function recommendations(): HasMany
    {
        return $this->hasMany(Recommendation::class);
    }
}
