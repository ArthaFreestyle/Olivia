'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
});
const GeoJSON = dynamic(() => import('react-leaflet').then((mod) => mod.GeoJSON), {
  ssr: false,
});

const Map = () => {
  const [isClient, setIsClient] = useState(false);
  const [geoData, setGeoData] = useState(null);
  const geoJsonRef = useRef(null);
  // Track the currently hovered layer
  const [activeLayer, setActiveLayer] = useState(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/geo.json');
        const data = await response.json();
        
        // Ensure each feature has an ID
        if (data && data.features) {
          data.features = data.features.map((feature, index) => {
            if (!feature.id && !feature.properties.id) {
              feature.id = `feature-${index}`;
            }
            return feature;
          });
        }
        
        setGeoData(data);
      } catch (error) {
        console.error("Error fetching GeoJSON data:", error);
      }
    };
  
    fetchData();
  }, []);

  // Default style for all features
  const defaultStyle = {
    fillColor: '#3388ff',
    weight: 1,
    opacity: 1,
    color: '#3388ff',
    fillOpacity: 0.3
  };

  // Highlight style for hovered feature
  const highlightStyle = {
    fillColor: '#0a4aa3',
    weight: 3,
    opacity: 1,
    color: '#0a4aa3',
    fillOpacity: 0.7
  };

  // Style function - just return default style
  // (we'll apply highlight directly in the event handlers)
  const geoJSONStyle = useCallback(() => {
    return defaultStyle;
  }, []);

  // Event handlers for each polygon/feature
  const onEachFeature = useCallback((feature, layer) => {
    // Get a unique identifier for this feature
    const featureId = feature.id || 
                     feature.properties?.id || 
                     feature.properties?.Propinsi ||
                     JSON.stringify(feature.geometry.coordinates[0][0]);
    
    // Set a property on the layer to identify it
    layer.feature.id = featureId;
    
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        
        // Apply highlight style to this layer only
        layer.setStyle(highlightStyle);
        
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          layer.bringToFront();
        }
        
        // Save reference to active layer
        setActiveLayer(layer);
        
        // Show tooltip with feature info
        const tooltipContent = feature.properties?.name || 
                             feature.properties?.Propinsi || 
                             feature.properties?.daerah || 
                             'Region';
        
        layer.bindTooltip(tooltipContent, { 
          permanent: false, 
          direction: 'center',
          className: 'custom-tooltip'
        }).openTooltip();
      },
      mouseout: (e) => {
        const layer = e.target;
        
        // Reset style for this specific layer only
        layer.setStyle(defaultStyle);
        
        setActiveLayer(null);
        
        // Close tooltip
        if (layer.getTooltip()) {
          layer.closeTooltip();
        }
      }
    });
  }, []);

  if (!isClient || !geoData) {
    return <div>Loading...</div>;
  }

  return (
    <MapContainer 
      center={[-2.5, 118]} 
      zoom={5} 
      style={{ height: '100vh', width: '100%' }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geoData && (
        <GeoJSON 
          data={geoData} 
          style={geoJSONStyle}
          onEachFeature={onEachFeature}
          ref={geoJsonRef}
        />
      )}
    </MapContainer>
  );
};

export default Map;