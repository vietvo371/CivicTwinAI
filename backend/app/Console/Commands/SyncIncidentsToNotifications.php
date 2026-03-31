<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Incident;
use App\Notifications\IncidentAlert;

#[Signature('app:sync-incidents-to-notifications')]
#[Description('Sync existing incidents to user notifications')]
class SyncIncidentsToNotifications extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $users = User::all();
        $incidents = Incident::all();

        $this->info("Syncing {$incidents->count()} incidents for {$users->count()} users...");

        foreach ($users as $user) {
            foreach ($incidents as $incident) {
                // Check if notification already exists for this incident
                // we use a simplified check - if incident_id exists in the json data
                $exists = $user->notifications()
                    ->where('data', 'like', '%"incident_id":' . $incident->id . '%')
                    ->exists();

                if (!$exists) {
                    $user->notify(new IncidentAlert($incident));
                }
            }
        }

        $this->info('Sync completed successfully!');
    }
}
