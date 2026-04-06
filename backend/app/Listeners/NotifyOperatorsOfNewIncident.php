<?php

namespace App\Listeners;

use App\Events\IncidentCreated;
use App\Models\User;
use App\Notifications\IncidentAlert;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/**
 * A1: Push + DB notification cho vận hành khi có incident mới (API hoặc auto-detect).
 */
class NotifyOperatorsOfNewIncident implements ShouldQueue
{
    use InteractsWithQueue;

    /** @var list<string> */
    public const OPERATOR_ROLES = [
        'emergency',
        'traffic_operator',
        'urban_planner',
        'super_admin',
        'city_admin',
    ];

    public function handle(IncidentCreated $event): void
    {
        $incident = $event->incident->fresh();
        if (! $incident) {
            return;
        }

        $users = User::query()
            ->whereHas('roles', function ($q): void {
                $q->whereIn('name', self::OPERATOR_ROLES);
            })
            ->get();

        foreach ($users as $user) {
            $user->notify(new IncidentAlert($incident));
        }
    }
}
