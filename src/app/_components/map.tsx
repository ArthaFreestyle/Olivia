'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
    ssr: false, // Nonaktifkan SSR untuk komponen ini
  });
  const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
    ssr: false,
  });
  const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
    ssr: false,
  });
  const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
    ssr: false,
  });

const Map = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Loading...</div>; // Ini bisa di-custom sesuai kebutuhan
  }

  return (
    <MapContainer center={[-0.7893, 113.9213]} zoom={6} style={{ height: '875px', width: '100%' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[-7.25, 112.75]}>
        <Popup>Ini Surabaya!</Popup>
      </Marker>
    </MapContainer>
  );
};

export default Map;
