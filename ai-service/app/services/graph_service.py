import networkx as nx
import logging
from app.core.database import database

logger = logging.getLogger(__name__)

class GraphService:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GraphService, cls).__new__(cls)
            cls._instance.graph = nx.DiGraph()
            cls._instance.is_loaded = False
        return cls._instance

    async def load_graph(self):
        """Khởi tạo DiGraph từ cơ sở dữ liệu edges của Laravel"""
        logger.info("Bắt đầu nạp dữ liệu Edges để dựng Đồ thị (Graph)...")
        
        query = """
            SELECT 
                id, source_node_id, target_node_id, direction, length_m, 
                speed_limit_kmh, lanes, current_density, current_speed_kmh 
            FROM edges
            WHERE deleted_at IS NULL
        """
        edges_records = await database.fetch_all(query)
        
        # Xóa graph cũ (nếu gọi để reload)
        self.graph.clear()
        
        for record in edges_records:
            edge_data = dict(record)
            src = edge_data['source_node_id']
            tgt = edge_data['target_node_id']
            edge_id = edge_data['id']
            direction = edge_data['direction']
            
            # Add edge details
            attr = {
                'edge_id': edge_id,
                'length': float(edge_data['length_m']),
                'speed_limit': float(edge_data['speed_limit_kmh']),
                'lanes': int(edge_data['lanes']),
                'density': float(edge_data['current_density']),
                'speed': float(edge_data['current_speed_kmh'])
            }
            
            # Nếu là đường một chiều
            self.graph.add_edge(src, tgt, **attr)
            
            # Nếu là đường hai chiều, thêm cả chiều ngược lại
            if direction == 'two_way':
                self.graph.add_edge(tgt, src, **attr)

        self.is_loaded = True
        logger.info(f"Đã nạp xong Đồ thị: {self.graph.number_of_nodes()} nút (nodes), {self.graph.number_of_edges()} cạnh chiều (edges).")

    def predict_cascading_impact(self, incident_edge_ids: list[int], severity: str, time_horizons: list[int] = [15, 30, 60]):
        """
        Mô phỏng đợt ùn tắc lan truyền:
        Từ các edge gặp sự cố, duyệt BFS để theo dõi sự lan tỏa của độ tắc nghẽn (density).
        (Thuật toán Heuristic Model cơ bản: 0.9 tại tâm sự cố, giám dần (decay) 0.15 đối với mỗi con đường lân cận).
        """
        if not self.is_loaded:
            logger.warning("Graph chưa được nạp. Không thể chạy AI Prediction.")
            return []
            
        severity_map = {"low": 0.4, "medium": 0.6, "high": 0.8, "critical": 0.95}
        base_density = severity_map.get(severity, 0.5)

        predictions = []
        
        # Tìm source target tuple list cho incident edge ids
        incident_tuples = []
        for u, v, d in self.graph.edges(data=True):
            if d.get('edge_id') in incident_edge_ids:
                incident_tuples.append((u, v))
                
        if not incident_tuples:
            return []

        # BFS Queue (edge_u, edge_v, current_depth, current_density)
        queue = []
        visited_edges = set()
        
        for u, v in incident_tuples:
            queue.append((u, v, 0, base_density))
            visited_edges.add(self.graph[u][v]['edge_id'])

        max_depth = 4 # Chi lan truyen duoc den 4 canh (hops) lien ke

        while queue:
            u, v, depth, current_density = queue.pop(0)
            edge_info = self.graph[u][v]
            edge_id = edge_info['edge_id']
            
            # Predict qua thoi gian (time horizons)
            for horizon in time_horizons:
                # density phai sinh thay doi chut dinh theo thoi gian (cang de lau o node trung tam cang nut)
                time_factor = 1.0 + (horizon / 60) * 0.2 if depth == 0 else max(1.0 - (horizon / 60) * 0.3, 0.5)
                final_density = min(current_density * time_factor, 1.0)
                
                # Confidence giam dan theo depth va theo tuong lai (horizon)
                conf = 0.9 - (depth * 0.1) - (horizon / 60 * 0.15)
                
                if final_density > 0.4: # Chi report nhung edge thuc su bi anh huong (mat do > 40%)
                    predictions.append({
                        "edge_id": edge_id,
                        "time_horizon_minutes": horizon,
                        "predicted_density": round(final_density, 4),
                        "predicted_delay_s": int(final_density * 300), # cong thuc uoc tinh cua heuristic (density * 300s)
                        "confidence": round(conf, 2),
                        "severity": "critical" if final_density > 0.8 else "high" if final_density > 0.6 else "medium"
                    })
                    
            if depth >= max_depth:
                continue
                
            # Sang canh ke tiep (successors)
            for next_node in self.graph.successors(v):
                # Bo qua U-turn (quay dau truc tiep lai node thu 1)
                if next_node == u:
                    continue
                    
                next_edge_info = self.graph[v][next_node]
                next_edge_id = next_edge_info['edge_id']
                
                if next_edge_id not in visited_edges:
                    visited_edges.add(next_edge_id)
                    decay_rate = 0.8 # Decay rate is 20%
                    next_density = current_density * decay_rate
                    if next_density > 0.3:
                        queue.append((v, next_node, depth + 1, next_density))
                        
        return predictions

graph_service = GraphService()
