"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LeafletEventHandlerFnMap } from "leaflet";
import { useCallback, useEffect, useMemo, useRef } from "react";

const markerIcon = new L.Icon({
  iconUrl:
    "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2_hdpi.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

export type MapPickerProps = {
  lat: number;
  lng: number;
  onChange: (coords: { lat: number; lng: number }) => void;
  height?: number | string;
  zoom?: number;
};

const ClickHandler = ({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const FlyToLocation = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 16, {
        duration: 1.2,
      });
    }
  }, [lat, lng, map]);

  return null;
};

const MapPicker = ({
  lat,
  lng,
  onChange,
  height = 300,
  zoom = 16,
}: MapPickerProps) => {
  const markerRef = useRef<L.Marker | null>(null);

  const eventHandlers: LeafletEventHandlerFnMap = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker) {
          const pos = marker.getLatLng();
          onChange({ lat: pos.lat, lng: pos.lng });
        }
      },
    }),
    [onChange]
  );

  const handleClick = useCallback(
    (newLat: number, newLng: number) => {
      onChange({ lat: newLat, lng: newLng });
    },
    [onChange]
  );

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: "100%",
      }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[lat, lng]}
        icon={markerIcon}
        draggable
        eventHandlers={eventHandlers}
        ref={markerRef}
      />
      <ClickHandler onClick={handleClick} />
      <FlyToLocation lat={lat} lng={lng} />
    </MapContainer>
  );
};

export default MapPicker;
