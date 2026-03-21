'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import {
  Database, MapPin, Route, Radio, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export default function MasterDataPage() {
  const [nodes, setNodes] = useState<AnyRecord[]>([]);
  const [edges, setEdges] = useState<AnyRecord[]>([]);
  const [sensors, setSensors] = useState<AnyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nodesRes, edgesRes] = await Promise.allSettled([
          api.get('/nodes'),
          api.get('/edges'),
        ]);

        if (nodesRes.status === 'fulfilled' && nodesRes.value.data?.data) {
          setNodes(nodesRes.value.data.data);
        }
        if (edgesRes.status === 'fulfilled' && edgesRes.value.data?.data) {
          setEdges(edgesRes.value.data.data);
        }
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
              <p className="text-2xl font-heading font-black">{loading ? '...' : nodes.length}</p>
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
              <p className="text-2xl font-heading font-black">{loading ? '...' : edges.length}</p>
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
              <p className="text-2xl font-heading font-black">{loading ? '...' : sensors.length}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">IoT Sensors</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      )}

      {!loading && (
        <Tabs defaultValue="nodes" className="space-y-4">
          <TabsList className="bg-card/80 border border-border">
            <TabsTrigger value="nodes" className="gap-1.5"><MapPin className="w-3.5 h-3.5" /> Nodes ({nodes.length})</TabsTrigger>
            <TabsTrigger value="edges" className="gap-1.5"><Route className="w-3.5 h-3.5" /> Edges ({edges.length})</TabsTrigger>
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
                      <TableHead>Zone</TableHead>
                      <TableHead>Coordinates</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nodes.map((node) => (
                      <TableRow key={node.id}>
                        <TableCell className="font-heading text-xs text-muted-foreground">#{node.id}</TableCell>
                        <TableCell className="font-semibold text-sm">{node.name}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{node.type}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{node.zone || '-'}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {node.location ? `${Number(node.location.lat).toFixed(4)}, ${Number(node.location.lng).toFixed(4)}` : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={node.status === 'active' ? 'outline' : 'secondary'} className={`text-[10px] uppercase tracking-wider gap-1 ${node.status === 'active' ? 'text-emerald-500 border-emerald-500/20' : 'text-rose-500'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {node.status}
                          </Badge>
                        </TableCell>
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
                      <TableHead className="text-center">Density</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {edges.map((edge) => (
                      <TableRow key={edge.id}>
                        <TableCell className="font-heading text-xs text-muted-foreground">#{edge.id}</TableCell>
                        <TableCell>
                          <p className="font-semibold text-sm">{edge.name}</p>
                          <p className="text-[11px] text-muted-foreground">Node #{edge.source_node_id} → #{edge.target_node_id}</p>
                        </TableCell>
                        <TableCell className="text-center font-medium">{edge.length_m ? `${(edge.length_m / 1000).toFixed(2)} km` : '-'}</TableCell>
                        <TableCell className="text-center font-heading font-bold">{edge.lanes}</TableCell>
                        <TableCell className="text-center">{edge.speed_limit_kmh} km/h</TableCell>
                        <TableCell className="text-center">
                          <span className={`text-xs font-bold ${(edge.current_density || 0) > 0.7 ? 'text-rose-500' : (edge.current_density || 0) > 0.4 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {((edge.current_density || 0) * 100).toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${edge.status === 'normal' ? 'text-emerald-500 border-emerald-500/20' : 'text-rose-500 border-rose-500/20'}`}>
                            {edge.congestion_level || edge.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
