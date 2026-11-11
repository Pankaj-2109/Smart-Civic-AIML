import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix leaflet default marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getSeverityColor = (severity, status) => {
  if (status === 'RESOLVED') return '#16a34a'; // green
  if (severity === 'HIGH') return '#ef4444'; // red
  if (severity === 'MEDIUM') return '#f59e0b'; // amber
  return '#3b82f6'; // blue / low
};

const MapView = ({
  complaints = [],
  center = [28.6139, 77.2090],
  zoom = 13,
  onSelectComplaint,
  isPickerMode = false,
  pickedLocation,
  onPickLocation,
  height = '480px',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const pickerMarkerRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Handle map clicks in picker mode
      map.on('click', (e) => {
        if (onPickLocation) {
          onPickLocation({ latitude: e.latlng.lat, longitude: e.latlng.lng });
        }
      });
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center if props change
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center?.[0], center?.[1], zoom]);

  // Handle picked location marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (pickedLocation && pickedLocation.latitude && pickedLocation.longitude) {
      const latlng = [pickedLocation.latitude, pickedLocation.longitude];
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng(latlng);
      } else {
        const pickerIcon = L.divIcon({
          className: 'custom-picker-pin',
          html: `<div style="background-color: #22c55e; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">📍</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });
        pickerMarkerRef.current = L.marker(latlng, { icon: pickerIcon }).addTo(mapInstanceRef.current);
      }
      mapInstanceRef.current.panTo(latlng);
    } else if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
  }, [pickedLocation?.latitude, pickedLocation?.longitude]);

  // Render complaint markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    complaints.forEach((comp) => {
      const loc = comp.location;
      if (!loc || !loc.latitude || !loc.longitude) return;

      const color = getSeverityColor(comp.severity, comp.status);
      const isResolved = comp.status === 'RESOLVED';

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px;">
            ${isResolved ? '✓' : (comp.severity === 'HIGH' ? '!' : '●')}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 max-w-[240px] text-xs font-sans';
      popupContent.innerHTML = `
        <div class="mb-2 rounded overflow-hidden shadow-sm h-28 bg-slate-100 flex items-center justify-center">
          <img src="${comp.image}" alt="${comp.category}" class="w-full h-full object-cover" onerror="this.src='/uploads/garbage_main_road.jpg'" />
        </div>
        <div class="flex items-center justify-between gap-1 mb-1">
          <span class="font-bold text-slate-800 text-sm">${comp.category}</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase text-white" style="background-color: ${color};">
            ${comp.status === 'RESOLVED' ? 'Resolved' : comp.severity}
          </span>
        </div>
        <p class="text-slate-600 line-clamp-2 mb-1.5 text-[11px] leading-tight">${comp.description}</p>
        <p class="text-slate-400 text-[10px] mb-2 font-medium">📍 ${loc.address || `${loc.latitude.toFixed(3)}, ${loc.longitude.toFixed(3)}`}</p>
        <button id="view-btn-${comp._id || comp.id}" class="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-1 px-2 rounded text-center block transition-colors">
          Inspect Details &rarr;
        </button>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-btn-${comp._id || comp.id}`);
        if (btn && onSelectComplaint) {
          btn.onclick = () => onSelectComplaint(comp);
        }
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [complaints, onSelectComplaint]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {isPickerMode && (
        <div className="absolute top-3 left-12 z-[500] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-1.5">
          <span>🎯 Click on the map to pinpoint issue location</span>
        </div>
      )}
    </div>
  );
};

export default MapView;

