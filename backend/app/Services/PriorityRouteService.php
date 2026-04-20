<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * PriorityRouteService — Dijkstra shortest-path routing for emergency vehicles.
 *
 * Uses live edge congestion data from the road network to compute
 * the fastest (not shortest) route from origin to destination,
 * avoiding edges with active incidents.
 */
final class PriorityRouteService
{
    /**
     * Find the fastest route for an emergency vehicle.
     *
     * Uses weighted Dijkstra where edge cost =
     *   travel_time * (1 + congestion_factor)
     *
     * Congestion factor: 0 = free flow, 2 = gridlock
     * Incidents on an edge → cost multiplied by 10 (almost impassable).
     *
     * @param  array{lat: float, lng: float}  $origin
     * @param  array{lat: float, lng: float}  $destination
     * @param  list<int>  $avoidEdgeIds  edges to avoid (incident locations)
     * @return array{route: list<array>, total_distance_m: float, estimated_time_s: int, is_blocked: bool}
     */
    public function findPriorityRoute(
        array $origin,
        array $destination,
        array $avoidEdgeIds = [],
    ): array {
        // Try PostGIS routing first
        $originNode = $this->nearestNode($origin['lat'], $origin['lng']);
        $destNode = $this->nearestNode($destination['lat'], $destination['lng']);

        if ($originNode && $destNode) {
            $edges = $this->dijkstraShortestPath(
                (int) $originNode->id,
                (int) $destNode->id,
                $avoidEdgeIds,
            );

            if ($edges !== []) {
                return $this->buildRouteResponse($edges, $originNode, $destNode);
            }
        }

        // Fallback: generate realistic mock route for demo
        return $this->generateFallbackRoute($origin, $destination);
    }

    /**
     * Find nearest road node to a GPS coordinate.
     */
    private function nearestNode(float $lat, float $lng): ?object
    {
        try {
            return DB::selectOne(
                'SELECT id, ST_X(geometry) as lng, ST_Y(geometry) as lat, name
                 FROM nodes
                 ORDER BY ST_Distance(geometry, ST_SetSRID(ST_Point(?, ?), 4326))
                 LIMIT 1',
                [$lng, $lat]
            );
        } catch (\Throwable $e) {
            Log::error('PriorityRoute.nearestNode_failed', ['lat' => $lat, 'lng' => $lng, 'err' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Dijkstra shortest path using recursive CTE (PostgreSQL 9.5+).
     *
     * Edge cost = travel_time_seconds * congestion_multiplier
     * Avoid edges listed in $avoidEdgeIds (cost = 99999).
     *
     * @return list<array> edges in order from origin to destination
     */
    private function dijkstraShortestPath(
        int $sourceNodeId,
        int $targetNodeId,
        array $avoidEdgeIds,
    ): array {
        $avoidSet = $avoidEdgeIds !== [] ? '{'.implode(',', $avoidEdgeIds).'}' : null;

        $sql = "
            WITH RECURSIVE dijkstra AS (
                -- Initialize: source node at distance 0
                SELECT
                    :source_id::int AS node_id,
                    ARRAY[:source_id::int] AS path,
                    0.0 AS cost,
                    ARRAY[]::int[] AS edge_path

                UNION ALL

                -- Relaxation step
                SELECT
                    e.target_node_id AS node_id,
                    d.path || e.target_node_id,
                    d.cost + (
                        CASE
                            WHEN :avoid_set IS NOT NULL
                             AND e.id = ANY(string_to_array(:avoid_set, ',')::int[])
                            THEN 99999.0
                            ELSE (e.length_m / NULLIF(e.current_speed_kmh, 0)) * (1.0 + COALESCE(e.current_density, 0))
                        END
                    ) AS cost,
                    d.edge_path || e.id
                FROM dijkstra d
                JOIN edges e ON e.source_node_id = d.node_id
                WHERE NOT (e.target_node_id = ANY(d.path))
                  AND e.deleted_at IS NULL
                  AND e.status != 'closed'
            )
            SELECT
                d.edge_path,
                d.cost AS total_cost,
                d.path AS node_path
            FROM dijkstra d
            WHERE d.node_id = :target_id
            ORDER BY d.cost ASC
            LIMIT 1
        ";

        try {
            $result = DB::select($sql, [
                'source_id' => $sourceNodeId,
                'target_id' => $targetNodeId,
                'avoid_set' => $avoidSet,
            ]);
        } catch (\Throwable $e) {
            Log::error('PriorityRoute.dijkstra_failed', [
                'source' => $sourceNodeId,
                'target' => $targetNodeId,
                'err' => $e->getMessage(),
            ]);

            return [];
        }

        if (! $result || ! $result[0]->edge_path) {
            return [];
        }

        // Fetch edge details for the path
        $edgeIds = array_filter($result[0]->edge_path, fn ($id) => $id !== null && $id !== '');
        if ($edgeIds === []) {
            return [];
        }

        $placeholders = implode(',', array_fill(0, count($edgeIds), '?'));
        $edges = DB::select(
            "SELECT
                e.id, e.name, e.length_m, e.lanes,
                e.speed_limit_kmh, e.current_density, e.current_speed_kmh,
                e.current_flow, e.congestion_level, e.status,
                ST_AsGeoJSON(e.geometry) as geometry,
                n1.name AS source_name, n1.id AS source_node_id,
                n2.name AS target_name, n2.id AS target_node_id
             FROM edges e
             JOIN nodes n1 ON n1.id = e.source_node_id
             JOIN nodes n2 ON n2.id = e.target_node_id
             WHERE e.id IN ({$placeholders})",
            $edgeIds
        );

        // Order edges by their position in the path
        $edgeMap = [];
        foreach ($edges as $edge) {
            $edgeMap[$edge->id] = $edge;
        }

        $ordered = [];
        foreach ($edgeIds as $edgeId) {
            if (isset($edgeMap[$edgeId])) {
                $ordered[] = $edgeMap[$edgeId];
            }
        }

        return $ordered;
    }

    /**
     * Build API response from ordered edge list.
     */
    private function buildRouteResponse(array $edges, object $originNode, object $destNode): array
    {
        $totalDistance = 0;
        $totalTime = 0;
        $route = [];

        foreach ($edges as $edge) {
            $travelTime = $edge->length_m / max($edge->current_speed_kmh, 1) * 3.6;
            $totalDistance += $edge->length_m;
            $totalTime += $travelTime;

            $route[] = [
                'edge_id' => $edge->id,
                'name' => $edge->name,
                'source_node' => $edge->source_name,
                'target_node' => $edge->target_name,
                'length_m' => round($edge->length_m, 1),
                'travel_time_s' => (int) round($travelTime),
                'current_speed_kmh' => round($edge->current_speed_kmh, 1),
                'current_density' => round($edge->current_density, 4),
                'congestion_level' => $edge->congestion_level,
                'lanes' => $edge->lanes,
                'geometry' => json_decode($edge->geometry, true),
                'instruction' => $this->turnInstruction($edge),
            ];
        }

        return [
            'route' => $route,
            'total_distance_m' => round($totalDistance, 1),
            'total_distance_km' => round($totalDistance / 1000, 2),
            'estimated_time_s' => (int) round($totalTime),
            'estimated_time_min' => (int) round($totalTime / 60),
            'is_blocked' => false,
            'origin_node' => [
                'id' => $originNode->id,
                'name' => $originNode->name,
                'lat' => round($originNode->lat, 6),
                'lng' => round($originNode->lng, 6),
            ],
            'destination_node' => [
                'id' => $destNode->id,
                'name' => $destNode->name,
                'lat' => round($destNode->lat, 6),
                'lng' => round($destNode->lng, 6),
            ],
            'congestion_avoided' => array_sum(array_column($route, 'current_density')) / count($route) > 0.5,
        ];
    }

    /**
     * Generate a human-readable turn instruction for an edge.
     */
    private function turnInstruction(object $edge): string
    {
        return sprintf(
            'Continue on %s (%d lanes, speed limit %d km/h)',
            $edge->name,
            $edge->lanes,
            (int) $edge->speed_limit_kmh
        );
    }

    /**
     * Fallback route for demo when DB nodes/edges are empty.
     * Generates 8 realistic Da Nang street segments.
     */
    private function generateFallbackRoute(array $origin, array $destination): array
    {
        $names = [
            'Nguyen Van Linh',
            'Dien Bien Phu',
            'Bach Dang',
            'Le Duan',
            'Tran Phu',
            'Nguyen Huu Tho',
            'Vo Nguyen Giap',
            'Tran Hung Dao',
        ];

        $route = [];
        $numSeg = 8;
        for ($i = 0; $i < $numSeg; $i++) {
            $t = $i / ($numSeg - 1);
            $lat = $origin['lat'] + ($destination['lat'] - $origin['lat']) * $t;
            $lng = $origin['lng'] + ($destination['lng'] - $origin['lng']) * $t;
            $density = 0.15 + 0.4 * sin($t * M_PI) * (($i > 2 && $i < 6) ? 1 : 0.3);

            $route[] = [
                'edge_id' => $i + 1,
                'name' => $names[$i % count($names)],
                'source_node' => 'Node '.($i + 1),
                'target_node' => 'Node '.($i + 2),
                'length_m' => 600 + rand(100, 1000),
                'travel_time_s' => 20 + rand(5, 40),
                'current_speed_kmh' => 35 + rand(-5, 25),
                'current_density' => round(min($density, 0.95), 4),
                'congestion_level' => $density > 0.6 ? 'high' : ($density > 0.3 ? 'medium' : 'low'),
                'lanes' => 2 + ($i % 3),
                'geometry' => [
                    'type' => 'LineString',
                    'coordinates' => [
                        [$lng, $lat],
                        [$lng + 0.001 * cos($i * M_PI / 4), $lat + 0.0015 * sin($i * M_PI / 4)],
                    ],
                ],
                'instruction' => $this->getFallbackInstruction($i, $numSeg),
            ];
        }

        $totalDist = array_sum(array_column($route, 'length_m'));
        $totalTime = array_sum(array_column($route, 'travel_time_s'));

        return [
            'route' => $route,
            'total_distance_m' => $totalDist,
            'total_distance_km' => round($totalDist / 1000, 2),
            'estimated_time_s' => $totalTime,
            'estimated_time_min' => (int) ceil($totalTime / 60),
            'is_blocked' => false,
            'origin_node' => [
                'id' => 0,
                'name' => 'Origin',
                'lat' => round($origin['lat'], 6),
                'lng' => round($origin['lng'], 6),
            ],
            'destination_node' => [
                'id' => 999,
                'name' => 'Destination',
                'lat' => round($destination['lat'], 6),
                'lng' => round($destination['lng'], 6),
            ],
            'congestion_avoided' => false,
            'is_fallback' => true,
        ];
    }

    private function getFallbackInstruction(int $segment, int $total): string
    {
        $steps = [
            'Start from origin, head east on main road',
            'Continue straight on Nguyen Van Linh',
            'Turn right onto Dien Bien Phu',
            'Continue on Bach Dang',
            'Turn left onto Le Duan',
            'Continue on Tran Phu',
            'Turn right onto Nguyen Huu Tho',
            'Continue to destination',
        ];

        return $steps[$segment % count($steps)];
    }
}
