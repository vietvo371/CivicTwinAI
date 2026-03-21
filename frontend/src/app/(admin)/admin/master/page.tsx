'use client';

import { useState } from 'react';
import {
  Database, MapPin, Route, Radio, Search, Filter,
  ChevronRight, Layers, BarChart2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DEMO_NODES = [
  { id: 1, name: 'Nga tu Hang Xanh', lat: 10.8011, lng: 106.7135, type: 'intersection', edges: 6 },
  { id: 2, name: 'Vong xoay Dien Bien Phu', lat: 10.7975, lng: 106.7099, type: 'roundabout', edges: 5 },
  { id: 3, name: 'Cau Sai Gon (Q2 side)', lat: 10.7918, lng: 106.7257, type: 'bridge', edges: 2 },
  { id: 4, name: 'Nga tu Phu Nhuan', lat: 10.7996, lng: 106.6812, type: 'intersection', edges: 4 },
  { id: 5, name: 'Cong vien 23/9', lat: 10.7681, lng: 106.6944, type: 'landmark', edges: 3 },
];

const DEMO_EDGES = [
  { id: 1, name: 'Hang Xanh → DBP', from_node: 1, to_node: 2, distance_km: 0.8, lanes: 3, speed_limit: 40 },
  { id: 2, name: 'DBP → Cau SG', from_node: 2, to_node: 3, distance_km: 2.1, lanes: 4, speed_limit: 60 },
  { id: 3, name: 'Hang Xanh → Phu Nhuan', from_node: 1, to_node: 4, distance_km: 1.5, lanes: 3, speed_limit: 40 },
  { id: 4, name: 'Phu Nhuan → 23/9', from_node: 4, to_node: 5, distance_km: 3.2, lanes: 4, speed_limit: 50 },
];

const DEMO_SENSORS = [
  { id: 1, name: 'SENSOR-HX-001', node_id: 1, type: 'traffic_counter', status: 'active', lastPing: '2s ago' },
  { id: 2, name: 'SENSOR-DBP-001', node_id: 2, type: 'camera_feed', status: 'active', lastPing: '5s ago' },
  { id: 3, name: 'SENSOR-CSG-001', node_id: 3, type: 'weather_station', status: 'active', lastPing: '10s ago' },
  { id: 4, name: 'SENSOR-PN-001', node_id: 4, type: 'traffic_counter', status: 'offline', lastPing: '3 days ago' },
];

export default function MasterDataPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/50 p-6 rounded-2xl border border-border backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-inner">
            <Database className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">Master Data</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage graph topology: nodes, edges & IoT sensors</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/50 backdrop-blur-xl border-border/80">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <MapPin className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-2xl font-heading font-black">{DEMO_NODES.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Graph Nodes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-xl border-border/80">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Route className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-heading font-black">{DEMO_EDGES.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Road Edges</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-xl border-border/80">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <Radio className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-heading font-black">{DEMO_SENSORS.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">IoT Sensors</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="nodes" className="space-y-4">
        <TabsList className="bg-card/80 border border-border">
          <TabsTrigger value="nodes" className="gap-1.5"><MapPin className="w-3.5 h-3.5" /> Nodes</TabsTrigger>
          <TabsTrigger value="edges" className="gap-1.5"><Route className="w-3.5 h-3.5" /> Edges</TabsTrigger>
          <TabsTrigger value="sensors" className="gap-1.5"><Radio className="w-3.5 h-3.5" /> Sensors</TabsTrigger>
        </TabsList>

        <TabsContent value="nodes">
          <Card className="overflow-hidden bg-card/40 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-card/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead className="text-center">Edges</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEMO_NODES.map((node) => (
                    <TableRow key={node.id}>
                      <TableCell className="font-heading text-xs text-muted-foreground">#{node.id}</TableCell>
                      <TableCell className="font-semibold text-sm">{node.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{node.type}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{node.lat.toFixed(4)}, {node.lng.toFixed(4)}</TableCell>
                      <TableCell className="text-center font-heading font-bold">{node.edges}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="edges">
          <Card className="overflow-hidden bg-card/40 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-card/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead className="text-center">Distance</TableHead>
                    <TableHead className="text-center">Lanes</TableHead>
                    <TableHead className="text-center">Speed Limit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEMO_EDGES.map((edge) => (
                    <TableRow key={edge.id}>
                      <TableCell className="font-heading text-xs text-muted-foreground">#{edge.id}</TableCell>
                      <TableCell>
                        <p className="font-semibold text-sm">{edge.name}</p>
                        <p className="text-[11px] text-muted-foreground">Node #{edge.from_node} → #{edge.to_node}</p>
                      </TableCell>
                      <TableCell className="text-center font-medium">{edge.distance_km} km</TableCell>
                      <TableCell className="text-center font-heading font-bold">{edge.lanes}</TableCell>
                      <TableCell className="text-center">{edge.speed_limit} km/h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sensors">
          <Card className="overflow-hidden bg-card/40 backdrop-blur-xl shadow-2xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-card/80">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[60px]">ID</TableHead>
                    <TableHead>Sensor</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Last Ping</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DEMO_SENSORS.map((sensor) => (
                    <TableRow key={sensor.id}>
                      <TableCell className="font-heading text-xs text-muted-foreground">#{sensor.id}</TableCell>
                      <TableCell>
                        <p className="font-semibold text-sm">{sensor.name}</p>
                        <p className="text-[11px] text-muted-foreground">Node #{sensor.node_id}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{sensor.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={sensor.status === 'active' ? 'outline' : 'secondary'} className={`text-[10px] uppercase tracking-wider gap-1 ${sensor.status === 'active' ? 'text-emerald-500 border-emerald-500/20' : 'text-rose-500'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${sensor.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {sensor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-muted-foreground">{sensor.lastPing}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
