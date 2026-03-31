<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels — CivicTwinAI
|--------------------------------------------------------------------------
|
| Public: traffic  — real-time incidents, edge metrics, predictions
| Public: incidents — incident CRUD events (IncidentCreated, etc.)
| Private: operator.{id} — operator-specific notifications (future)
|
*/

// Public channel — real-time traffic & graph metrics
// Events: IncidentCreated, EdgeMetricsUpdated, PredictionReceived
Broadcast::channel('traffic', function () {
    return true;
});

// Public channel — incident lifecycle events (mobile app)
// Events: IncidentCreated, IncidentUpdated, IncidentResolved
Broadcast::channel('incidents', function () {
    return true;
});

// Private user channel
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});
