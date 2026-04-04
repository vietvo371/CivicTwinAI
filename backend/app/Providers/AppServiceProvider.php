<?php

namespace App\Providers;

use App\Events\IncidentCreated;
use App\Listeners\MirrorDatabaseNotificationToFcm;
use App\Listeners\NotifyOperatorsOfNewIncident;
use App\Models\Incident;
use App\Observers\IncidentObserver;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(IncidentCreated::class, NotifyOperatorsOfNewIncident::class);
        Event::listen(NotificationSent::class, MirrorDatabaseNotificationToFcm::class);
        Incident::observe(IncidentObserver::class);
    }
}
