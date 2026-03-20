<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Zone extends Model
{
    protected $fillable = ['name', 'code', 'type', 'metadata'];

    protected function casts(): array
    {
        return ['metadata' => 'array'];
    }

    public function nodes(): HasMany
    {
        return $this->hasMany(Node::class);
    }
}
