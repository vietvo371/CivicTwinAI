"""
Generate Synthetic Traffic Dataset for Da Nang City
====================================================
Tạo dữ liệu giao thông giả lập mô phỏng các pattern thực tế:
- Giờ cao điểm sáng (7-9h), chiều (17-19h)
- Cuối tuần thấp hơn ngày thường
- Mưa → density tăng 20-30%
- Random incidents → spike cục bộ
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os

np.random.seed(42)

# Da Nang road segments (edge IDs + names)
EDGES = [
    {"id": 1, "name": "Cau Rong - Tran Hung Dao", "base_density": 0.35, "type": "bridge"},
    {"id": 2, "name": "Cau Song Han - Bach Dang", "base_density": 0.40, "type": "bridge"},
    {"id": 3, "name": "Nguyen Van Linh - D. 2/9", "base_density": 0.30, "type": "arterial"},
    {"id": 4, "name": "Dien Bien Phu - Nguyen Tri Phuong", "base_density": 0.45, "type": "arterial"},
    {"id": 5, "name": "Le Duan - Tran Phu", "base_density": 0.38, "type": "arterial"},
    {"id": 6, "name": "Ngo Quyen - Phan Chu Trinh", "base_density": 0.28, "type": "collector"},
    {"id": 7, "name": "Vo Nguyen Giap - My Khe", "base_density": 0.22, "type": "coastal"},
    {"id": 8, "name": "Ton Duc Thang - Hoa Xuan", "base_density": 0.33, "type": "arterial"},
    {"id": 9, "name": "Cach Mang T8 - Hoa Khanh", "base_density": 0.42, "type": "highway"},
    {"id": 10, "name": "Truong Chinh - Lien Chieu", "base_density": 0.36, "type": "highway"},
    {"id": 11, "name": "Hoang Sa - Son Tra", "base_density": 0.18, "type": "coastal"},
    {"id": 12, "name": "Pham Van Dong - Ngu Hanh Son", "base_density": 0.32, "type": "arterial"},
    {"id": 13, "name": "Nguyen Huu Tho - Cam Le", "base_density": 0.38, "type": "collector"},
    {"id": 14, "name": "Ham Nghi - Thanh Khe", "base_density": 0.44, "type": "arterial"},
    {"id": 15, "name": "Nui Thanh - Hai Chau", "base_density": 0.40, "type": "arterial"},
    {"id": 16, "name": "D. 30/4 - Hoa Cuong", "base_density": 0.25, "type": "residential"},
    {"id": 17, "name": "Le Thanh Nghi - DHBK", "base_density": 0.30, "type": "collector"},
    {"id": 18, "name": "Nguyen Luong Bang - DTU", "base_density": 0.34, "type": "collector"},
    {"id": 19, "name": "Tran Dai Nghia - FPT", "base_density": 0.20, "type": "residential"},
    {"id": 20, "name": "Cau Thuan Phuoc", "base_density": 0.28, "type": "bridge"},
]

def hour_factor(hour: int, is_weekend: bool) -> float:
    """Traffic multiplier based on hour of day"""
    if is_weekend:
        # Weekend: lighter, peak around 10-12h and 18-20h
        factors = {
            0: 0.1, 1: 0.08, 2: 0.05, 3: 0.05, 4: 0.06, 5: 0.12,
            6: 0.2, 7: 0.35, 8: 0.5, 9: 0.65, 10: 0.75, 11: 0.8,
            12: 0.7, 13: 0.65, 14: 0.7, 15: 0.75, 16: 0.8, 17: 0.85,
            18: 0.9, 19: 0.8, 20: 0.6, 21: 0.4, 22: 0.25, 23: 0.15
        }
    else:
        # Weekday: morning rush 7-9, evening rush 17-19
        factors = {
            0: 0.08, 1: 0.05, 2: 0.04, 3: 0.04, 4: 0.06, 5: 0.15,
            6: 0.4, 7: 0.85, 8: 0.95, 9: 0.7, 10: 0.55, 11: 0.6,
            12: 0.65, 13: 0.55, 14: 0.5, 15: 0.6, 16: 0.75, 17: 0.95,
            18: 0.9, 19: 0.7, 20: 0.5, 21: 0.35, 22: 0.2, 23: 0.12
        }
    return factors.get(hour, 0.3)

def weather_factor(day_of_year: int) -> float:
    """Simulate rain seasons in Da Nang (Oct-Dec heavy rain)"""
    # Rainy season: months 9-12 (day 270-365)
    if 270 <= day_of_year <= 365:
        rain_prob = 0.4
    elif 150 <= day_of_year < 270:
        rain_prob = 0.15
    else:
        rain_prob = 0.1
    
    if np.random.random() < rain_prob:
        return 1.0 + np.random.uniform(0.15, 0.35)  # Rain: +15-35%
    return 1.0

def generate_incidents(n_timestamps: int, n_edges: int) -> dict:
    """Generate random traffic incidents"""
    incidents = {}
    n_incidents = int(n_timestamps * 0.02)  # 2% of timestamps have incidents
    
    for _ in range(n_incidents):
        ts_idx = np.random.randint(0, n_timestamps)
        edge_idx = np.random.randint(0, n_edges)
        severity = np.random.choice([0.3, 0.5, 0.8, 1.0], p=[0.4, 0.3, 0.2, 0.1])
        duration = np.random.randint(3, 12)  # 15min - 1h in 5-min steps
        
        for d in range(duration):
            key = (ts_idx + d, edge_idx)
            decay = max(0, severity * (1 - d / duration * 0.5))
            incidents[key] = max(incidents.get(key, 0), decay)
    
    return incidents

def generate_dataset(days: int = 90, interval_minutes: int = 5):
    """
    Generate traffic dataset
    - days: number of days to simulate (default 90 = 3 months)
    - interval_minutes: time step (default 5 min)
    """
    start_date = datetime(2026, 1, 1)
    timestamps_per_day = 24 * 60 // interval_minutes  # 288 per day
    total_timestamps = days * timestamps_per_day
    
    incidents = generate_incidents(total_timestamps, len(EDGES))
    
    records = []
    
    for t in range(total_timestamps):
        current_time = start_date + timedelta(minutes=t * interval_minutes)
        hour = current_time.hour
        minute = current_time.minute
        day_of_week = current_time.weekday()
        is_weekend = day_of_week >= 5
        day_of_year = current_time.timetuple().tm_yday
        
        h_factor = hour_factor(hour, is_weekend)
        w_factor = weather_factor(day_of_year)
        
        for edge_idx, edge in enumerate(EDGES):
            # Base density with temporal pattern
            density = edge["base_density"] * h_factor * w_factor
            
            # Road type modifier
            type_mod = {"bridge": 1.2, "arterial": 1.0, "highway": 0.9, 
                       "collector": 0.85, "coastal": 0.7, "residential": 0.6}
            density *= type_mod.get(edge["type"], 1.0)
            
            # Add incident spike
            incident_val = incidents.get((t, edge_idx), 0)
            if incident_val > 0:
                density += incident_val * 0.5
            
            # Add noise
            noise = np.random.normal(0, 0.03)
            density = np.clip(density + noise, 0.0, 1.0)
            
            # Speed inversely related to density
            base_speed = 40  # km/h average
            speed = base_speed * (1 - density * 0.7) + np.random.normal(0, 2)
            speed = np.clip(speed, 5, 60)
            
            records.append({
                "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                "edge_id": edge["id"],
                "edge_name": edge["name"],
                "density": round(density, 4),
                "speed_kmh": round(speed, 2),
                "hour": hour,
                "minute": minute,
                "day_of_week": day_of_week,
                "is_weekend": int(is_weekend),
                "is_rush_hour": int(hour in [7, 8, 17, 18]),
                "has_incident": int(incident_val > 0),
            })
    
    df = pd.DataFrame(records)
    
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(output_dir, "traffic_dataset.csv")
    df.to_csv(output_path, index=False)
    
    print(f"✅ Dataset generated: {output_path}")
    print(f"   Records: {len(df):,}")
    print(f"   Date range: {df['timestamp'].min()} → {df['timestamp'].max()}")
    print(f"   Edges: {df['edge_id'].nunique()}")
    print(f"   Avg density: {df['density'].mean():.4f}")
    print(f"   Incidents: {df['has_incident'].sum():,} records")
    
    return df

if __name__ == "__main__":
    generate_dataset(days=90, interval_minutes=5)
