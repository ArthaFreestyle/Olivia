// src/components/CategoryControl.js
'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CategoryControl = ({ position, onClick }) => {
  const map = useMap();

  useEffect(() => {
    // Buat kontrol kustom
    const CustomButton = L.Control.extend({
      options: {
        position: position || 'topright',
      },
      onAdd: () => {
        const container = L.DomUtil.create('div', 'leaflet-control leaflet-bar');
        const button = L.DomUtil.create('button', 'leaflet-control-custom', container);
        button.innerHTML = 'Category';
        button.style.padding = '5px 10px';
        button.style.cursor = 'pointer';
        button.style.backgroundColor = '#fff';
        button.style.border = '2px solid rgba(0,0,0,0.2)';
        button.style.borderRadius = '4px';
        button.style.zIndex = '1000';

        // Tangani klik pada tombol
        L.DomEvent.on(button, 'click', () => {
          onClick(); // Panggil onClick tanpa parameter map
        });

        return container;
      },
      onRemove: () => {},
    });

    const control = new CustomButton();
    map.addControl(control);

    // Cleanup saat komponen di-unmount
    return () => {
      map.removeControl(control);
    };
  }, [map, onClick, position]);

  return null;
};

export default CategoryControl;