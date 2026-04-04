<?php

namespace App\Observers;

use App\Models\Incident;
use App\Models\User;
use App\Notifications\IncidentReportStatusNotification;

/**
 * B1: Khi operator đổi trạng thái incident, báo người đã báo cáo (reported_by).
 */
class IncidentObserver
{
    public function updated(Incident $incident): void
    {
        if (! $incident->wasChanged('status')) {
            return;
        }

        $reporterId = $incident->reported_by;
        if ($reporterId === null) {
            return;
        }

        $reporter = User::query()->find($reporterId);
        if (! $reporter) {
            return;
        }

        $old = (string) $incident->getOriginal('status');
        $new = (string) $incident->status;

        $reporter->notify(new IncidentReportStatusNotification($incident, $old, $new));
    }
}
