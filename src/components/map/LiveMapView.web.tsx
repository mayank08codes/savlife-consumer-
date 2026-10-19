// 🗺️ Real-time Interactive Leaflet Map for SavLife (Web & Mobile Web)
// Ultra-realistic OpenStreetMap/Carto Voyager tiles, 3D Ambulance Marker with Strobe Siren, Double-Cased Route Polyline, and Live Sector 128 Patrol Units

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Crosshair, Navigation, ZoomIn, ZoomOut, Compass } from 'lucide-react-native';
import { COLORS } from '../../constants/colors';
import { Hospital } from '../../services/mockDataService';
import L from 'leaflet';

interface LiveMapViewProps {
  pickupLocation: { latitude: number; longitude: number; address?: string };
  driverLocation?: { latitude: number; longitude: number; heading?: number };
  destinationHospital?: Hospital | null;
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  showPickupPuck?: boolean;
  showDriverMarker?: boolean;
  showDestinationMarker?: boolean;
  showPatrolUnits?: boolean;
  style?: any;
  onCenterMap?: () => void;
}

export const LiveMapView: React.FC<LiveMapViewProps> = ({
  pickupLocation,
  driverLocation,
  destinationHospital,
  routeCoordinates = [],
  showPickupPuck = true,
  showDriverMarker = false,
  showDestinationMarker = false,
  showPatrolUnits = true,
  style,
  onCenterMap,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const hospitalMarkerRef = useRef<L.Marker | null>(null);
  const polylineCasingRef = useRef<L.Polyline | null>(null);
  const polylineInnerRef = useRef<L.Polyline | null>(null);
  const patrolMarkersRef = useRef<L.Marker[]>([]);

  // 🎨 Inject custom CSS styles & animations into DOM
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const cssId = 'savelife-map-styles';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-bundle';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const styleTag = document.createElement('style');
        styleTag.id = cssId;
        styleTag.innerHTML = `
          @keyframes savelife-gps-pulse {
            0% { transform: scale(0.9); opacity: 0.8; }
            50% { transform: scale(2.2); opacity: 0.2; }
            100% { transform: scale(2.6); opacity: 0; }
          }
          @keyframes siren-strobe-red {
            0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px #EF4444); }
            50% { opacity: 0.3; filter: none; }
          }
          @keyframes siren-strobe-blue {
            0%, 100% { opacity: 0.3; filter: none; }
            50% { opacity: 1; filter: drop-shadow(0 0 8px #3B82F6); }
          }
          .savelife-gps-aura {
            position: absolute;
            width: 44px;
            height: 44px;
            top: -10px;
            left: -10px;
            border-radius: 50%;
            background-color: rgba(37, 99, 235, 0.35);
            animation: savelife-gps-pulse 2s infinite ease-out;
            pointer-events: none;
          }
          .savelife-patrol-aura {
            position: absolute;
            width: 36px;
            height: 36px;
            top: -6px;
            left: -6px;
            border-radius: 50%;
            background-color: rgba(16, 185, 129, 0.3);
            animation: savelife-gps-pulse 2.4s infinite ease-out;
            pointer-events: none;
          }
          .leaflet-control-attribution {
            display: none !important;
          }
        `;
        document.head.appendChild(styleTag);
      }
    }
  }, []);

  // 🗺️ Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    try {
      const map = L.map(mapContainerRef.current, {
        center: [pickupLocation.latitude, pickupLocation.longitude],
        zoom: 15.5,
        zoomControl: false,
        attributionControl: false,
        preferCanvas: true,
      });

      // CartoDB Voyager Clean High-Resolution Basemap
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        detectRetina: true,
      }).addTo(map);

      mapInstanceRef.current = map;
    } catch (e) {
      console.warn('Leaflet initialization warning:', e);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 📍 Update Pickup Marker with Real GPS Aura & Callout
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (showPickupPuck) {
      const pickupHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
          <div style="
            background: #047857;
            color: #FFFFFF;
            font-size: 10px;
            font-weight: 800;
            padding: 4px 8px;
            border-radius: 12px;
            white-space: nowrap;
            box-shadow: 0 3px 8px rgba(0,0,0,0.25);
            margin-bottom: 3px;
            border: 1.5px solid #FFFFFF;
          ">
            📍 Pickup Point
          </div>
          <div style="position: relative; width: 24px; height: 24px;">
            <div class="savelife-gps-aura"></div>
            <div style="
              width: 24px;
              height: 24px;
              border-radius: 12px;
              background: #2563EB;
              border: 3px solid #FFFFFF;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 3px 8px rgba(0,0,0,0.35);
            ">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#FFFFFF" style="transform: rotate(45deg);">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
              </svg>
            </div>
          </div>
        </div>
      `;

      const pickupIcon = L.divIcon({
        className: 'savelife-custom-pickup',
        html: pickupHtml,
        iconSize: [110, 52],
        iconAnchor: [55, 50],
      });

      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = L.marker(
          [pickupLocation.latitude, pickupLocation.longitude],
          { icon: pickupIcon, zIndexOffset: 1000 }
        ).addTo(map);
      } else {
        pickupMarkerRef.current.setLatLng([pickupLocation.latitude, pickupLocation.longitude]);
      }
    } else if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
  }, [pickupLocation, showPickupPuck]);

  // 🚑 Update Live Emergency Ambulance Marker (3D Styled Top-Down Ambulance with Strobe Sirens)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (showDriverMarker && driverLocation) {
      const heading = driverLocation.heading || 0;
      const driverHtml = `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <!-- 3D Ambulance Body -->
          <div style="
            width: 38px;
            height: 38px;
            border-radius: 19px;
            background: #FFFFFF;
            border: 2px solid #EF4444;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.45);
            transform: rotate(${heading}deg);
            transition: transform 0.2s linear;
            position: relative;
          ">
            <!-- Strobe Lights -->
            <div style="position: absolute; top: 3px; left: 8px; width: 6px; height: 6px; border-radius: 3px; background: #EF4444; animation: siren-strobe-red 0.4s infinite;"></div>
            <div style="position: absolute; top: 3px; right: 8px; width: 6px; height: 6px; border-radius: 3px; background: #3B82F6; animation: siren-strobe-blue 0.4s infinite;"></div>

            <!-- Ambulance SVG Icon -->
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="1" y="3" width="15" height="13"></rect>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              <circle cx="5.5" cy="18.5" r="2.5" fill="#1E293B"></circle>
              <circle cx="18.5" cy="18.5" r="2.5" fill="#1E293B"></circle>
              <line x1="8.5" y1="7" x2="8.5" y2="12" stroke="#DC2626" stroke-width="2.5"></line>
              <line x1="6" y1="9.5" x2="11" y2="9.5" stroke="#DC2626" stroke-width="2.5"></line>
            </svg>
          </div>
        </div>
      `;

      const driverIcon = L.divIcon({
        className: 'savelife-custom-driver',
        html: driverHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker(
          [driverLocation.latitude, driverLocation.longitude],
          { icon: driverIcon, zIndexOffset: 2000 }
        ).addTo(map);

        // Auto-fit map bounds on first load so user sees ambulance approaching down the street!
        try {
          const bounds = L.latLngBounds([
            [driverLocation.latitude, driverLocation.longitude],
            [pickupLocation.latitude, pickupLocation.longitude],
          ]);
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16.5 });
        } catch (e) {}
      } else {
        driverMarkerRef.current.setLatLng([driverLocation.latitude, driverLocation.longitude]);
        driverMarkerRef.current.setIcon(driverIcon);
      }
    } else if (driverMarkerRef.current) {
      driverMarkerRef.current.remove();
      driverMarkerRef.current = null;
    }
  }, [driverLocation, showDriverMarker, pickupLocation]);

  // 🏥 Update Destination Hospital Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (showDestinationMarker && destinationHospital) {
      const hospitalHtml = `
        <div style="
          display: flex;
          align-items: center;
          background: #047857;
          border: 2px solid #FFFFFF;
          padding: 5px 10px;
          border-radius: 16px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          gap: 6px;
          white-space: nowrap;
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span style="color: #FFFFFF; font-size: 11px; font-weight: 800;">
            ${destinationHospital.name.slice(0, 18)}
          </span>
          <span style="background: rgba(255,255,255,0.25); color: #FFFFFF; font-size: 9px; font-weight: 800; padding: 2px 5px; border-radius: 6px;">
            ${destinationHospital.icuBedsAvailable} ICU
          </span>
        </div>
      `;

      const hospitalIcon = L.divIcon({
        className: 'savelife-custom-hospital',
        html: hospitalHtml,
        iconSize: [170, 34],
        iconAnchor: [85, 17],
      });

      if (!hospitalMarkerRef.current) {
        hospitalMarkerRef.current = L.marker(
          [destinationHospital.latitude, destinationHospital.longitude],
          { icon: hospitalIcon, zIndexOffset: 900 }
        ).addTo(map);
      } else {
        hospitalMarkerRef.current.setLatLng([destinationHospital.latitude, destinationHospital.longitude]);
      }
    } else if (hospitalMarkerRef.current) {
      hospitalMarkerRef.current.remove();
      hospitalMarkerRef.current = null;
    }
  }, [destinationHospital, showDestinationMarker]);

  // 🛣️ Update Double-Cased Route Polyline (Shrinks Dynamically in Real Time)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routeCoordinates && routeCoordinates.length > 1) {
      const latLngs: [number, number][] = routeCoordinates.map((c) => [c.latitude, c.longitude]);

      // Outer dark casing border
      if (!polylineCasingRef.current) {
        polylineCasingRef.current = L.polyline(latLngs, {
          color: '#1E3A8A',
          weight: 8,
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);
      } else {
        polylineCasingRef.current.setLatLngs(latLngs);
      }

      // Inner bright electric blue line
      if (!polylineInnerRef.current) {
        polylineInnerRef.current = L.polyline(latLngs, {
          color: '#2563EB',
          weight: 5,
          opacity: 1.0,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);
      } else {
        polylineInnerRef.current.setLatLngs(latLngs);
      }
    } else {
      if (polylineCasingRef.current) {
        polylineCasingRef.current.remove();
        polylineCasingRef.current = null;
      }
      if (polylineInnerRef.current) {
        polylineInnerRef.current.remove();
        polylineInnerRef.current = null;
      }
    }
  }, [routeCoordinates]);

  // 🚨 Patrol Units around Sector 128 (When in idle map view)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous patrol markers
    patrolMarkersRef.current.forEach((m) => m.remove());
    patrolMarkersRef.current = [];

    if (showPatrolUnits && !showDriverMarker) {
      const patrolPositions = [
        { lat: pickupLocation.latitude + 0.007, lng: pickupLocation.longitude + 0.008, name: 'ALS Unit 1 (3m)' },
        { lat: pickupLocation.latitude - 0.006, lng: pickupLocation.longitude - 0.007, name: 'ALS Unit 2 (4m)' },
        { lat: pickupLocation.latitude + 0.004, lng: pickupLocation.longitude - 0.009, name: 'BLS Unit 3 (2m)' },
      ];

      patrolPositions.forEach((pos) => {
        const patrolHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              background: rgba(15, 23, 42, 0.85);
              color: #10B981;
              font-size: 9px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 8px;
              white-space: nowrap;
              margin-bottom: 2px;
            ">
              ${pos.name}
            </div>
            <div style="position: relative; width: 28px; height: 28px;">
              <div class="savelife-patrol-aura"></div>
              <div style="
                width: 28px;
                height: 28px;
                border-radius: 14px;
                background: #FFFFFF;
                border: 2px solid #10B981;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.25);
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
            </div>
          </div>
        `;

        const pIcon = L.divIcon({
          className: 'savelife-patrol-marker',
          html: patrolHtml,
          iconSize: [80, 44],
          iconAnchor: [40, 42],
        });

        const marker = L.marker([pos.lat, pos.lng], { icon: pIcon, zIndexOffset: 500 }).addTo(map);
        patrolMarkersRef.current.push(marker);
      });
    }
  }, [pickupLocation, showPatrolUnits, showDriverMarker]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [pickupLocation.latitude, pickupLocation.longitude],
        16,
        { animate: true }
      );
    }
    if (onCenterMap) onCenterMap();
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Real Interactive Leaflet Container */}
      <div
        ref={mapContainerRef as any}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />

      {/* Floating Map Navigation Controls */}
      <View style={styles.floatingControls}>
        <TouchableOpacity
          style={styles.controlBtn}
          activeOpacity={0.8}
          onPress={handleRecenter}
        >
          <Crosshair size={18} color={COLORS.primaryDark} />
        </TouchableOpacity>

        <View style={styles.zoomPill}>
          <TouchableOpacity
            style={styles.zoomBtn}
            activeOpacity={0.8}
            onPress={handleZoomIn}
          >
            <ZoomIn size={16} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.zoomDivider} />

          <TouchableOpacity
            style={styles.zoomBtn}
            activeOpacity={0.8}
            onPress={handleZoomOut}
          >
            <ZoomOut size={16} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  floatingControls: {
    position: 'absolute',
    right: 14,
    bottom: 24,
    gap: 8,
    alignItems: 'center',
    zIndex: 20,
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  zoomPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 38,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
});
