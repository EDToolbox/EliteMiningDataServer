# Performance Monitoring Script für Elite Mining Data Server
# Überwacht MongoDB Performance und EDDN Datenvolumen

import time
import pymongo
import requests
import json
from datetime import datetime, timedelta

class PerformanceMonitor:
    def __init__(self, mongo_uri="mongodb://localhost:27017", api_url="http://localhost:3000"):
        self.client = pymongo.MongoClient(mongo_uri)
        self.db = self.client.elite_mining
        self.api_url = api_url
        
    def monitor_data_volume(self):
        """Überwacht die Datenmenge in MongoDB"""
        
        # Collection Größen
        collections = ['mining_sites', 'commodity_prices', 'systems', 'stations', 'mining_reports']
        
        stats = {
            'timestamp': datetime.now().isoformat(),
            'collections': {}
        }
        
        for collection_name in collections:
            collection = self.db[collection_name]
            count = collection.count_documents({})
            size = self.db.command("collStats", collection_name).get('size', 0)
            
            stats['collections'][collection_name] = {
                'documents': count,
                'size_bytes': size,
                'size_mb': round(size / 1024 / 1024, 2)
            }
            
        # Gesamtstatistiken
        total_docs = sum(col['documents'] for col in stats['collections'].values())
        total_size = sum(col['size_bytes'] for col in stats['collections'].values())
        
        stats['totals'] = {
            'documents': total_docs,
            'size_mb': round(total_size / 1024 / 1024, 2),
            'size_gb': round(total_size / 1024 / 1024 / 1024, 2)
        }
        
        return stats
    
    def monitor_eddn_performance(self):
        """Überwacht EDDN Nachrichten-Performance"""
        
        try:
            response = requests.get(f"{self.api_url}/api/status", timeout=5)
            if response.status_code == 200:
                return response.json()
        except:
            return None
    
    def analyze_growth_rate(self):
        """Analysiert Datenwachstumsrate"""
        
        # Mining Reports der letzten 24 Stunden
        yesterday = datetime.now() - timedelta(hours=24)
        
        recent_reports = self.db.mining_reports.count_documents({
            'timestamp': {'$gte': yesterday}
        })
        
        # Commodity Price Updates der letzten Stunde
        last_hour = datetime.now() - timedelta(hours=1)
        
        recent_prices = self.db.commodity_prices.count_documents({
            'lastUpdated': {'$gte': last_hour}
        })
        
        return {
            'mining_reports_24h': recent_reports,
            'price_updates_1h': recent_prices,
            'estimated_daily_growth': recent_reports,
            'estimated_hourly_prices': recent_prices
        }
    
    def run_monitoring(self, interval=300):
        """Führt kontinuierliches Monitoring durch"""
        
        print("🚀 Elite Mining Data Performance Monitor gestartet")
        print(f"📊 Monitoring alle {interval} Sekunden")
        print("=" * 60)
        
        while True:
            try:
                # Datenvolumen
                volume_stats = self.monitor_data_volume()
                
                # Performance
                api_stats = self.monitor_eddn_performance()
                
                # Wachstumsrate
                growth_stats = self.analyze_growth_rate()
                
                # Output
                print(f"\n📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                print("=" * 60)
                
                # Datenbank Größe
                print(f"💾 Gesamte Datenbankgröße: {volume_stats['totals']['size_gb']:.2f} GB")
                print(f"📄 Gesamte Dokumente: {volume_stats['totals']['documents']:,}")
                
                # Collections
                for name, stats in volume_stats['collections'].items():
                    print(f"   {name}: {stats['documents']:,} docs ({stats['size_mb']:.1f} MB)")
                
                # Wachstum
                print(f"\n📈 Mining Reports (24h): {growth_stats['mining_reports_24h']:,}")
                print(f"💰 Preis-Updates (1h): {growth_stats['price_updates_1h']:,}")
                
                # API Performance
                if api_stats:
                    server_stats = api_stats.get('server', {})
                    print(f"⏱️  Server Uptime: {server_stats.get('uptime', 0):.0f}s")
                    
                    memory = api_stats.get('memory', {})
                    if memory:
                        print(f"🧠 Memory Usage: {memory.get('used', 0)}MB / {memory.get('total', 0)}MB")
                
                print("=" * 60)
                
                # Warnungen
                if volume_stats['totals']['size_gb'] > 10:
                    print("⚠️  WARNUNG: Datenbankgröße über 10 GB!")
                
                if growth_stats['price_updates_1h'] > 10000:
                    print("🔥 Hohe Aktivität: Über 10k Preis-Updates/Stunde")
                
                time.sleep(interval)
                
            except KeyboardInterrupt:
                print("\n\n👋 Monitoring beendet")
                break
            except Exception as e:
                print(f"❌ Fehler: {e}")
                time.sleep(interval)

if __name__ == "__main__":
    monitor = PerformanceMonitor()
    monitor.run_monitoring(interval=300)  # Alle 5 Minuten