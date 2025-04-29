"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const GeoJSON = dynamic(
  () => import("react-leaflet").then((mod) => mod.GeoJSON),
  { ssr: false }
);

const months = [
  { id: 1, name: "Januari", code: "1" },
  { id: 2, name: "Februari", code: "2" },
  { id: 3, name: "Maret", code: "3" },
  { id: 4, name: "April", code: "4" },
  { id: 5, name: "Mei", code: "5" },
];

const Map = () => {
  const [geoData, setGeoData] = useState(null);
  const [bpsData, setBpsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(months[0]);
  const geoJsonRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  const API_KEY = "5065bedad441b6074ff02c53c82931c9";

  const fetchBpsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/0000/var/2506/key/${API_KEY}`
      );
      const data = await res.json();
      if (data.status === "OK" && data["data-availability"] === "available") {
        setBpsData(data);
      } else {
        console.error("Invalid BPS response", data);
        setBpsData(null);
      }
    } catch (err) {
      console.error("Fetch BPS error:", err);
      setBpsData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBpsData();
  }, [fetchBpsData]);

  useEffect(() => {
    const loadGeo = async () => {
      try {
        const res = await fetch("/data/geo.json");
        const data = await res.json();
        setGeoData(data);
      } catch (err) {
        console.error("Failed to load GeoJSON:", err);
      }
    };
    loadGeo();
  }, []);

  const extractDataFromBpsResponse = useCallback((data, monthCode) => {
    const result = {};
    if (!data || !data.datacontent || !data.vervar) return result;

    Object.keys(data.vervar).forEach((index) => {
      const provCode = data.vervar[index].val;
      if (provCode === "9999") return;

      const key = `${provCode}25060125${monthCode}`;
      if (data.datacontent[key]) {
        result[provCode] = data.datacontent[key];
      }
    });

    return result;
  }, []);

  const updateGeoDataWithRiceData = useCallback(
    (geo, bps, monthCode) => {
      if (!geo || !bps) return geo;

      const riceData = extractDataFromBpsResponse(bps, monthCode);
      const cloned = JSON.parse(JSON.stringify(geo));

      cloned.features.forEach((feature) => {
        const code = feature.properties.kode || feature.properties.REGION_CODE;
        if (code === "9999") return;
        feature.properties.riceData = {
          nilai: riceData[code] || 0,
          satuan: "Ton",
          nama: feature.properties.name || feature.properties.nama,
        };
      });

      return cloned;
    },
    [extractDataFromBpsResponse]
  );

  const getColor = (value) => {
    if (value == null || value === 0) return '#E5E5E5'; // putih: tidak ada data
  
    return value > 100000 ? '#00441b' :        // hijau tua
           value > 50000  ? '#238b45' :        // hijau sedang
           value > 25000  ? '#66bd63' :        // hijau muda
           value > 1000  ? '#a6d96a' :        // kuning kehijauan
           value > 500   ? '#fee08b' :        // kuning pucat
           value > 250   ? '#fdae61' :        // oranye muda
           value > 100   ? '#f46d43' :        // oranye tua
           value > 10    ? '#d73027' :        // merah terang
                             '#a50026';         // merah tua
  };

  const geoJSONStyle = useCallback((feature) => {
    const value = feature.properties?.riceData?.nilai || 0;
    return {
      fillColor: getColor(value),
      weight: 1,
      color: "#FFF",
      fillOpacity: 0.7,
    };
  }, []);

  const onEachFeature = useCallback(
    (feature, layer) => {
      layer.on({
        mouseover: (e) => {
          const l = e.target;
          l.setStyle({ weight: 3, color: "#000", fillOpacity: 0.9 });
          const rice = feature.properties?.riceData?.nilai || 0;
          const name = feature.properties?.riceData?.nama || "";
          const satuan = feature.properties?.riceData?.satuan || "";
          l.bindTooltip(
            `${name}<br />Produksi: ${rice.toLocaleString("id-ID", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${satuan}`,
            {
              permanent: false,
              direction: "center",
            }
          ).openTooltip();
        },
        mouseout: (e) => {
          const l = e.target;
          l.setStyle(geoJSONStyle(feature));
          l.closeTooltip();
        },
      });
    },
    [geoJSONStyle]
  );

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
    if (geoJsonRef.current && geoData && bpsData) {
      const updated = updateGeoDataWithRiceData(geoData, bpsData, month.code);
      geoJsonRef.current.clearLayers();
      geoJsonRef.current.addData(updated);
    }
  };

  const prepareGeoData = useCallback(() => {
    if (!geoData || !bpsData) return null;
    return updateGeoDataWithRiceData(geoData, bpsData, selectedMonth.code);
  }, [geoData, bpsData, selectedMonth, updateGeoDataWithRiceData]);

  if (!isClient) return <div>Loading map...</div>;

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            zIndex: 1000,
          }}
        >
          Loading data...
        </div>
      )}
      <MapContainer
        center={[-2.5, 118]}
        zoom={5}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {geoData && bpsData && (
          <GeoJSON
            data={prepareGeoData()}
            style={geoJSONStyle}
            onEachFeature={onEachFeature}
            ref={geoJsonRef}
          />
        )}
      </MapContainer>

      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 1000,
          background: "white",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        <label>Pilih Bulan: </label>
        <select
          value={selectedMonth.id}
          onChange={(e) => {
            const month = months.find((m) => m.id === parseInt(e.target.value));
            handleMonthChange(month);
          }}
        >
          {months.map((month) => (
            <option key={month.id} value={month.id}>
              {month.name}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 10,
          right: 10,
          zIndex: 1000,
          background: "white",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        <h4>Legenda (Ton)</h4>
        <div>
          <span
            style={{
              background: "#00441b",
              width: "20px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>{" "}
          &gt; 2,000,000
        </div>
        <div>
          <span
            style={{
              background: "#238b45",
              width: "20px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>{" "}
          1,000,000 - 2,000,000
        </div>
        <div>
          <span
            style={{
              background: "#66bd63",
              width: "20px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>{" "}
          500,000 - 1,000,000
        </div>
        <div>
          <span
            style={{
              background: "#a6d96a",
              width: "20px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>{" "}
          250,000 - 500,000
        </div>
        <div>
          <span
            style={{
              background: "#d9ef8b",
              width: "20px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>{" "}
          100,000 - 250,000
        </div>
        <div>
          <span
            style={{
              background: "#fee08b",
              width: "20px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>{" "}
          50,000 - 100,000
        </div>
        <div>
          <span
            style={{
              background: "#fdae61",
              width: "20px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>{" "}
          25,000 - 50,000
        </div>
        <div>
          <span
            style={{
              background: "#f46d43",
              width: "20px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>{" "}
          10,000 - 25,000
        </div>
        <div>
          <span
            style={{
              background: "#d73027",
              width: "20px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>{" "}
          0 - 10,000
        </div>
        <div>
          <span
            style={{
              background: "#E5E5E5",
              width: "20px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>{" "}
          Tidak ada data
        </div>
      </div>
    </div>
  );
};

export default Map;
