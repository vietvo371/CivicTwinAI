<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels — CivicTwinAI
|--------------------------------------------------------------------------
|
| Public: traffic — real-time incidents, edge metrics, predictions
| Private: operator.{id} — operator-specific notifications (future)
|
*/

// Public channel — mọi người đều có thể lắng nghe
// Events: IncidentCreated, EdgeMetricsUpdated, PredictionReceived
Broadcast::channel('traffic', function () {
    return true;
});

// Private user channel
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
