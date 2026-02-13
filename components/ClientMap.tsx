"use client";

import { useEffect, useRef, useState } from "react";

interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  description?: string;
}

interface ClientMapProps {
  places: Place[];
  dayNumber: number;
  fullHeight?: boolean;
  selectedPlaceIndex?: number | null;
}


export default function ClientMap({ places, dayNumber, fullHeight = false, selectedPlaceIndex = null }: ClientMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const leafletRef = useRef<any>(null);
  const prevSelectedRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client-side
    if (typeof window === "undefined" || !mapRef.current) return;

    let L: any;
    let mounted = true;

    const initMap = async () => {
      try {
        // Dynamically import Leaflet only on client-side
        L = (await import("leaflet")).default;
        leafletRef.current = L;

        if (!mounted) return;

        // Fix marker icon issue
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        // Filter valid places
        const validPlaces = places.filter(
          (p) => p.latitude !== 0 && p.longitude !== 0
        );

        if (validPlaces.length === 0) {
          setError("No valid coordinates");
          setIsLoading(false);
          return;
        }

        // Calculate center
        const sumLat = validPlaces.reduce((sum, p) => sum + p.latitude, 0);
        const sumLng = validPlaces.reduce((sum, p) => sum + p.longitude, 0);
        const center: [number, number] = [
          sumLat / validPlaces.length,
          sumLng / validPlaces.length,
        ];

        // Create map
        const map = L.map(mapRef.current).setView(center, 13);
        mapInstanceRef.current = map;

        // Add high-quality tile layer with retina support
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
          detectRetina: true, // Enable retina/high-DPI support
        }).addTo(map);

        // Default dot icon (small, neutral — no number)
        const createDotIcon = () => {
          return L.divIcon({
            className: "custom-marker",
            html: `
              <div style="
                width: 14px;
                height: 14px;
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                border-radius: 50%;
                border: 2.5px solid white;
                box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
              "></div>
            `,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            popupAnchor: [0, -10],
          });
        };

        // Active pin icon (large, numbered — shows on selection)
        const createActiveIcon = (number: number) => {
          return L.divIcon({
            className: "custom-marker",
            html: `
              <div style="
                position: relative;
                width: 40px;
                height: 40px;
                animation: markerBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
              ">
                <div style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 40px;
                  height: 40px;
                  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
                  border-radius: 50% 50% 50% 0;
                  transform: rotate(-45deg);
                  border: 3px solid white;
                  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.5), 0 0 0 4px rgba(139, 92, 246, 0.2);
                "></div>
                <div style="
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -60%);
                  color: white;
                  font-weight: bold;
                  font-size: 15px;
                  z-index: 1;
                  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
                ">${number}</div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40],
          });
        };

        // Add markers and collect coordinates for path
        const pathCoordinates: [number, number][] = [];
        const markers: any[] = [];

        validPlaces.forEach((place, index) => {
          const coords: [number, number] = [place.latitude, place.longitude];
          pathCoordinates.push(coords);

          const marker = L.marker(coords, {
            icon: createDotIcon(),
          }).addTo(map);
          markers.push(marker);

          // Store place data and icon creators on the marker for later use
          marker._placeData = { place, index };
          marker._createDotIcon = createDotIcon;
          marker._createActiveIcon = createActiveIcon;

          // Store popup content for programmatic use
          const popupHtml = `
            <div style="font-family: 'Quicksand', sans-serif; padding: 4px;">
              <h4 style="font-weight: 700; font-size: 17px; margin: 0 0 10px 0; color: #1f2937; letter-spacing: -0.02em; line-height: 1.3;">
                <span style="display: inline-block; width: 28px; height: 28px; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; border-radius: 50%; text-align: center; line-height: 28px; font-size: 14px; margin-right: 8px; box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);">${index + 1}</span>
                ${place.name}
              </h4>
              <p style="font-size: 14px; margin: 0 0 12px 0; color: #6b7280; line-height: 1.6; font-weight: 500;">
                📍 ${place.address}
              </p>
              ${place.description && place.description !== "N/A" 
                ? `<p style="font-size: 13px; margin: 0 0 14px 0; color: #9ca3af; line-height: 1.7; font-weight: 400; padding: 12px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 10px; border-left: 3px solid #a78bfa;">
                  ${place.description}
                </p>` 
                : ""
              }
              <span style="display: inline-block; font-size: 11px; font-weight: 700; background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%); color: #7c3aed; padding: 6px 14px; border-radius: 20px; letter-spacing: 0.05em; text-transform: uppercase;">
                ${place.category}
              </span>
            </div>
          `;
          marker._popupHtml = popupHtml;

          // Bind popup for manual clicks on the marker itself
          marker.bindPopup(popupHtml, {
            maxWidth: 300,
            className: 'custom-popup'
          });
        });

        markersRef.current = markers;

        // Helper: calculate bearing between two lat/lng points (degrees, clockwise from north)
        const getBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
          const toRad = (d: number) => (d * Math.PI) / 180;
          const dLng = toRad(lng2 - lng1);
          const y = Math.sin(dLng) * Math.cos(toRad(lat2));
          const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
          return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
        };

        // Draw path connecting places
        if (pathCoordinates.length > 1) {
          // Shadow layer
          L.polyline(pathCoordinates, {
            color: "#000000",
            weight: 5,
            opacity: 0.1,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
          
          // Main path
          L.polyline(pathCoordinates, {
            color: "#c4b5fd",
            weight: 3,
            opacity: 0.7,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
          
          // Animated dashes
          L.polyline(pathCoordinates, {
            color: "#8b5cf6",
            weight: 2,
            opacity: 0.9,
            dashArray: "8, 12",
            lineCap: "round",
            lineJoin: "round",
            className: "animated-path",
          }).addTo(map);

          // Direction arrows at midpoints between consecutive places
          for (let i = 0; i < pathCoordinates.length - 1; i++) {
            const [lat1, lng1] = pathCoordinates[i];
            const [lat2, lng2] = pathCoordinates[i + 1];
            const midLat = (lat1 + lat2) / 2;
            const midLng = (lng1 + lng2) / 2;
            const bearing = getBearing(lat1, lng1, lat2, lng2);

            const arrowIcon = L.divIcon({
              className: "direction-arrow",
              html: `
                <div style="
                  width: 22px;
                  height: 22px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transform: rotate(${bearing}deg);
                  filter: drop-shadow(0 1px 3px rgba(124, 58, 237, 0.4));
                ">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L13 11L8 8.5L3 11L8 1Z" fill="#7c3aed" stroke="white" stroke-width="1" stroke-linejoin="round"/>
                  </svg>
                </div>
              `,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            });

            L.marker([midLat, midLng], {
              icon: arrowIcon,
              interactive: false,
              zIndexOffset: 400,
            }).addTo(map);
          }
        }

        // Start marker label
        if (validPlaces.length >= 1) {
          const startIcon = L.divIcon({
            className: "start-end-label",
            html: `
              <div style="
                display: flex;
                align-items: center;
                gap: 4px;
                background: #10b981;
                color: white;
                padding: 3px 10px 3px 6px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 700;
                font-family: 'Quicksand', sans-serif;
                white-space: nowrap;
                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
                border: 2px solid white;
                letter-spacing: 0.03em;
              ">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="4" fill="white" opacity="0.9"/>
                  <circle cx="6" cy="6" r="2" fill="#10b981"/>
                </svg>
                START
              </div>
            `,
            iconSize: [60, 24],
            iconAnchor: [30, 42],
          });
          L.marker([validPlaces[0].latitude, validPlaces[0].longitude], {
            icon: startIcon,
            interactive: false,
            zIndexOffset: 600,
          }).addTo(map);
        }

        // End marker label
        if (validPlaces.length >= 2) {
          const last = validPlaces[validPlaces.length - 1];
          const endIcon = L.divIcon({
            className: "start-end-label",
            html: `
              <div style="
                display: flex;
                align-items: center;
                gap: 4px;
                background: #ef4444;
                color: white;
                padding: 3px 10px 3px 6px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 700;
                font-family: 'Quicksand', sans-serif;
                white-space: nowrap;
                box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
                border: 2px solid white;
                letter-spacing: 0.03em;
              ">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="3" y="3" width="6" height="6" rx="1" fill="white" opacity="0.9"/>
                </svg>
                END
              </div>
            `,
            iconSize: [48, 24],
            iconAnchor: [24, 42],
          });
          L.marker([last.latitude, last.longitude], {
            icon: endIcon,
            interactive: false,
            zIndexOffset: 600,
          }).addTo(map);
        }

        // Fit bounds to show all markers
        const bounds = L.latLngBounds(pathCoordinates);
        map.fitBounds(bounds, { padding: [50, 50] });

        setIsLoading(false);
      } catch (err) {
        console.error("Map initialization error:", err);
        setError("Failed to load map");
        setIsLoading(false);
      }
    };

    initMap();

    // Cleanup
    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [places, dayNumber]);

  // Handle selected place - swap icons and open popup
  useEffect(() => {
    const L = leafletRef.current;
    if (!mapInstanceRef.current || !markersRef.current.length || !L) return;

    const map = mapInstanceRef.current;
    const markers = markersRef.current;

    // Close any existing popup on the map
    map.closePopup();

    // Reset previously selected marker back to dot
    if (prevSelectedRef.current !== null && prevSelectedRef.current !== selectedPlaceIndex) {
      const prevMarker = markers[prevSelectedRef.current];
      if (prevMarker && prevMarker._createDotIcon) {
        prevMarker.setIcon(prevMarker._createDotIcon());
        prevMarker.setZIndexOffset(0);
      }
    }

    // Activate the newly selected marker
    if (selectedPlaceIndex !== null && selectedPlaceIndex !== undefined) {
      const marker = markers[selectedPlaceIndex];
      if (marker && marker._createActiveIcon) {
        const num = marker._placeData.index + 1;
        marker.setIcon(marker._createActiveIcon(num));
        marker.setZIndexOffset(1000);

        const latlng = marker.getLatLng();
        const popupHtml = marker._popupHtml;

        // Pan to the marker, then open a standalone popup on the map
        map.panTo(latlng, { animate: true, duration: 0.4 });

        setTimeout(() => {
          L.popup({
            maxWidth: 300,
            className: "custom-popup",
            offset: [0, -44],
          })
            .setLatLng(latlng)
            .setContent(popupHtml)
            .openOn(map);
        }, 500);
      }
    }

    prevSelectedRef.current = selectedPlaceIndex ?? null;
  }, [selectedPlaceIndex]);

  const validPlaces = places.filter(
    (p) => p.latitude !== 0 && p.longitude !== 0
  );

  if (validPlaces.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-violet-50 to-blue-50 ${fullHeight ? 'h-full' : 'rounded-xl'} p-8 text-center border-2 border-dashed border-violet-200 flex items-center justify-center`}>
        <p className="text-gray-600">
          📍 No map coordinates available for this day
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 ${fullHeight ? 'h-full' : 'rounded-xl'} p-8 text-center border border-red-200 flex items-center justify-center`}>
        <p className="text-red-600">⚠️ {error}</p>
      </div>
    );
  }

  // Full height mode - no header, just map
  if (fullHeight) {
    return (
      <div className="h-full w-full relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-50 to-blue-50 z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      <div className="bg-gradient-to-r from-violet-50 to-blue-50 px-5 py-4 border-b">
        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2 tracking-tight">
          <span className="text-xl">🗺️</span>
          Day {dayNumber} Route Map
        </h3>
        <p className="text-sm text-gray-600 mt-1.5 font-medium">
          {validPlaces.length} location{validPlaces.length > 1 ? "s" : ""}
        </p>
      </div>
      <div className="relative h-[400px] w-full">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-50 to-blue-50 z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">Loading map...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
}
