"use client";

import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

const customIcon = new L.Icon({
  iconUrl:
    "https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi2_hdpi.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

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

const MapView = ({ lat, lng }: { lat: number; lng: number }) => {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      style={{ height: "300px", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={customIcon} />
      <FlyToLocation lat={lat} lng={lng} />
    </MapContainer>
  );
};

export default MapView;
