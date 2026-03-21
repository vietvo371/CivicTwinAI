<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Node;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Helpers\ApiResponse;

class NodeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Node::with('zone');

        if ($request->has('zone_id')) {
            $query->where('zone_id', $request->zone_id);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $nodes = $query->get()->map(fn ($node) => [
            'id' => $node->id,
            'name' => $node->name,
            'type' => $node->type,
            'zone' => $node->zone?->name,
            'has_traffic_light' => $node->has_traffic_light,
            'status' => $node->status,
            'location' => DB::selectOne(
                'SELECT ST_X(location) as lng, ST_Y(location) as lat FROM nodes WHERE id = ?',
                [$node->id]
            ),
        ]);

        return ApiResponse::success($nodes, 'api.nodes_retrieved');
    }

    public function show(Node $node): JsonResponse
    {
        $node->load('zone');

        $coords = DB::selectOne(
            'SELECT ST_X(location) as lng, ST_Y(location) as lat FROM nodes WHERE id = ?',
            [$node->id]
        );

        return ApiResponse::success([
            'id' => $node->id,
            'name' => $node->name,
            'type' => $node->type,
            'zone' => $node->zone?->name,
            'has_traffic_light' => $node->has_traffic_light,
            'status' => $node->status,
            'metadata' => $node->metadata,
            'location' => $coords,
            'outgoing_edges_count' => $node->outgoingEdges()->count(),
            'incoming_edges_count' => $node->incomingEdges()->count(),
        ], 'api.node_details');
    }
}
