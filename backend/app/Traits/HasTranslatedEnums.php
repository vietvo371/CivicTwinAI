<?php

namespace App\Traits;

/**
 * Trait HasTranslatedEnums
 *
 * Add this trait to any Model that has enum-like fields.
 * Define $translatedEnums on the model to map field names to their
 * translation group in lang/{locale}/enums.php.
 *
 * Example:
 *   protected static array $translatedEnums = [
 *       'type'     => 'incident_type',
 *       'status'   => 'incident_status',
 *       'severity' => 'incident_severity',
 *   ];
 *
 * Then call:
 *   $incident->translated('type')     → "Tai nạn" (vi) or "Accident" (en)
 *   $incident->translated('status')   → "Đang mở" (vi) or "Open" (en)
 *   Incident::enumOptions('type')     → ['accident' => 'Tai nạn', ...]
 */
trait HasTranslatedEnums
{
    /**
     * Get translated label for a specific enum field value.
     */
    public function translated(string $field): string
    {
        $value = $this->{$field};
        if (!$value) return '';

        $group = static::$translatedEnums[$field] ?? $field;

        return __("enums.{$group}.{$value}");
    }

    /**
     * Get all translated options for a given enum field.
     * Useful for dropdowns/filters in API responses.
     *
     * Returns: [['value' => 'accident', 'label' => 'Tai nạn'], ...]
     */
    public static function enumOptions(string $field): array
    {
        $group = static::$translatedEnums[$field] ?? $field;
        $translations = __("enums.{$group}");

        if (!is_array($translations)) return [];

        return collect($translations)->map(fn ($label, $value) => [
            'value' => $value,
            'label' => $label,
        ])->values()->toArray();
    }

    /**
     * Get the translation group key for a field.
     */
    public static function enumGroup(string $field): string
    {
        return static::$translatedEnums[$field] ?? $field;
    }
}
