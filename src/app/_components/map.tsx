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
  { id: 1, name: "Januari", code: "1", quarter: 1 },
  { id: 2, name: "Februari", code: "2", quarter: 1 },
  { id: 3, name: "Maret", code: "3", quarter: 1 },
  { id: 4, name: "April", code: "4", quarter: 2 },
  { id: 5, name: "Mei", code: "5", quarter: 2 },
  { id: 6, name: "Juni", code: "6", quarter: 2 },
  { id: 7, name: "Juli", code: "7", quarter: 3 },
  { id: 8, name: "Agustus", code: "8", quarter: 3 },
  { id: 9, name: "September", code: "9", quarter: 3 },
  { id: 10, name: "Oktober", code: "10", quarter: 4 },
  { id: 11, name: "November", code: "11", quarter: 4 },
  { id: 12, name: "Desember", code: "12", quarter: 4 },
];

const categories = [
  { id: 'Beras', name: 'Padi', code: '2506' },
  { id: 'jagung', name: 'Jagung Pipil', code: '2507' },
];

const quarters = [
  { id: 1, name: "Kuartal 1 (Jan-Mar)", months: months.filter(m => m.quarter === 1) },
  { id: 2, name: "Kuartal 2 (Apr-Jun)", months: months.filter(m => m.quarter === 2) },
  { id: 3, name: "Kuartal 3 (Jul-Sep)", months: months.filter(m => m.quarter === 3) },
  { id: 4, name: "Kuartal 4 (Okt-Des)", months: months.filter(m => m.quarter === 4) },
];

const Map = () => {
  const [geoData, setGeoData] = useState(null);
  const [bpsData, setBpsData] = useState(null);
  const [historicalData, setHistoricalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(months[0]);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  
  // Menentukan kuartal saat ini berdasarkan waktu saat ini
  const getCurrentQuarter = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    
    // Menentukan kuartal berdasarkan bulan saat ini
    let currentQuarterId;
    if (currentMonth >= 1 && currentMonth <= 3) {
      currentQuarterId = 1; // Q1 (Jan-Mar)
    } else if (currentMonth >= 4 && currentMonth <= 6) {
      currentQuarterId = 2; // Q2 (Apr-Jun)
    } else if (currentMonth >= 7 && currentMonth <= 9) {
      currentQuarterId = 3; // Q3 (Jul-Sep)
    } else {
      currentQuarterId = 4; // Q4 (Oct-Dec)
    }
    
    // Memastikan kita tidak memilih kuartal yang tidak ada dalam daftar
    const availableQuarterId = Math.min(currentQuarterId, quarters.length);
    return quarters.find(q => q.id === availableQuarterId) || quarters[0];
  };
  
  // Inisialisasi dengan kuartal saat ini
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const geoJsonRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  const API_KEY = "5065bedad441b6074ff02c53c82931c9";

  const fetchBpsData = useCallback(async (category) => {
    setIsLoading(true);
    // Use the passed category or the current selectedCategory
    const categoryToFetch = category || selectedCategory;
    
    try {
      const res = await fetch(
        `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/0000/var/${categoryToFetch.code}/key/${API_KEY}`
      );
      const data = await res.json();
      if (data.status === "OK" && data["data-availability"] === "available") {
        setBpsData(data);
        // Ekstrak data historis untuk setiap bulan
        const historicalDataObj = {};
        
        // Iterasi melalui semua bulan untuk mengekstrak data historis
        months.forEach(month => {
          // Use the passed category for extraction
          const monthlyData = extractDataFromBpsResponse(data, month.code, categoryToFetch);
          historicalDataObj[month.code] = monthlyData;
        });
        
        setHistoricalData(historicalDataObj);
      } else {
        console.error("Invalid BPS response", data);
        setBpsData(null);
        setHistoricalData({});
      }
    } catch (err) {
      console.error("Fetch BPS error:", err);
      setBpsData(null);
      setHistoricalData({});
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchBpsData(selectedCategory);
  }, [fetchBpsData, selectedCategory]);

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

  const extractDataFromBpsResponse = useCallback((data, monthCode, category) => {
    const result = {};
    if (!data || !data.datacontent || !data.vervar) return result;
    
    // Use the passed category or fall back to the selected category
    const categoryToUse = category || selectedCategory;

    Object.keys(data.vervar).forEach((index) => {
      const provCode = data.vervar[index].val;
      if (provCode === "9999") return;

      const key = `${provCode}${categoryToUse.code}0125${monthCode}`;
      if (data.datacontent[key]) {
        result[provCode] = parseFloat(data.datacontent[key]);
      }
    });

    return result;
  }, [selectedCategory]);

  // Fungsi untuk menghitung tren perbandingan kuartal
  const calculateTrend = useCallback((provinceCode, currentQuarter) => {
    // Dapatkan kuartal saat ini dan kuartal sebelumnya
    const previousQuarter = currentQuarter - 1;
    
    // Jika tidak ada kuartal sebelumnya, tidak bisa menghitung tren
    if (previousQuarter < 1) {
      return { trend: "nodata", data: [] };
    }
    
    // Dapatkan bulan-bulan yang termasuk dalam kuartal saat ini dan sebelumnya
    const currentQuarterMonths = months.filter(m => m.quarter === currentQuarter);
    const previousQuarterMonths = months.filter(m => m.quarter === previousQuarter);
    
    // Hitung total produksi untuk kuartal saat ini
    let currentQuarterTotal = 0;
    let currentQuarterMonthsWithData = 0;
    currentQuarterMonths.forEach(month => {
      const value = historicalData[month.code]?.[provinceCode] || 0;
      if (value > 0) {
        currentQuarterTotal += value;
        currentQuarterMonthsWithData++;
      }
    });
    
    // Hitung total produksi untuk kuartal sebelumnya
    let previousQuarterTotal = 0;
    let previousQuarterMonthsWithData = 0;
    previousQuarterMonths.forEach(month => {
      const value = historicalData[month.code]?.[provinceCode] || 0;
      if (value > 0) {
        previousQuarterTotal += value;
        previousQuarterMonthsWithData++;
      }
    });
    
    // Jika tidak ada data yang cukup dari salah satu kuartal, tidak bisa dihitung trendnya
    if (currentQuarterMonthsWithData === 0 || previousQuarterMonthsWithData === 0) {
      return { trend: "nodata", data: [] };
    }
    
    // Hitung rata-rata per kuartal untuk perbandingan yang adil
    const currentQuarterAvg = currentQuarterTotal / currentQuarterMonthsWithData;
    const previousQuarterAvg = previousQuarterTotal / previousQuarterMonthsWithData;
    
    // Hitung persentase perubahan
    const percentChange = ((currentQuarterAvg - previousQuarterAvg) / previousQuarterAvg) * 100;
    
    // Tentukan tren berdasarkan perubahan persentase
    let trend;
    if (percentChange > 5) trend = "up"; // Naik jika lebih dari 5%
    else if (percentChange < -5) trend = "down"; // Turun jika kurang dari -5%
    else trend = "stable"; // Stabil jika perubahannya kecil
    
    // Kumpulkan data untuk ditampilkan
    const quarterData = [
      { quarter: previousQuarter, value: previousQuarterAvg, total: previousQuarterTotal, months: previousQuarterMonthsWithData },
      { quarter: currentQuarter, value: currentQuarterAvg, total: currentQuarterTotal, months: currentQuarterMonthsWithData }
    ];
    
    return { 
      trend, 
      data: quarterData,
      percentChange: percentChange
    };
  }, [historicalData]);

  const updateGeoDataWithTrendData = useCallback(
    (geo, bps, quarterObj, category) => {
      if (!geo || !bps || Object.keys(historicalData).length === 0) return geo;

      // Use the passed category or fall back to the selected category
      const categoryToUse = category || selectedCategory;

      const cloned = JSON.parse(JSON.stringify(geo));
      // Ambil data dari bulan terakhir dalam kuartal untuk nilai saat ini
      const lastMonthInQuarter = quarterObj.months[quarterObj.months.length - 1];
      const currentDataByProvince = extractDataFromBpsResponse(bps, lastMonthInQuarter.code, categoryToUse);

      cloned.features.forEach((feature) => {
        const code = feature.properties.kode || feature.properties.REGION_CODE;
        if (code === "9999") return;
        
        const currentValue = currentDataByProvince[code] || 0;
        const { trend, data, percentChange } = calculateTrend(code, quarterObj.id);
        
        feature.properties.cropData = {
          nilai: currentValue,
          trendData: data,
          trend: trend,
          percentChange: percentChange || 0,
          satuan: "Ton",
          nama: feature.properties.name || feature.properties.nama,
          kategori: categoryToUse.name
        };
      });

      return cloned;
    },
    [extractDataFromBpsResponse, calculateTrend, historicalData, selectedCategory]
  );

  const getColor = (trend) => {
    switch (trend) {
      case "up":
        return "#27AE60"; // hijau untuk tren naik (> +5%)
      case "down":
        return "#E74C3C"; // merah untuk tren turun (< -5%)
      case "stable":
        return "#F1C40F"; // kuning untuk tren stabil (antara -5% sampai +5%)
      case "nodata":
      default:
        return "#E5E5E5"; // abu-abu untuk tidak ada data
    }
  };

  const geoJSONStyle = useCallback((feature) => {
    const trend = feature.properties?.cropData?.trend || "nodata";
    return {
      fillColor: getColor(trend),
      weight: 1,
      color: "#FFF",
      fillOpacity: 0.7,
    };
  }, []);

  const formatTrendData = (data) => {
    if (!data || data.length < 2) return "Data tidak cukup";
    
    return data.map(quarter => {
      return `Kuartal ${quarter.quarter}: ${quarter.total.toLocaleString("id-ID", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} Ton (${quarter.months} bulan)`;
    }).join("<br />");
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return "↗️";
      case "down":
        return "↘️";
      case "stable":
        return "→";
      default:
        return "❓";
    }
  };

  const onEachFeature = useCallback(
    (feature, layer) => {
      layer.on({
        mouseover: (e) => {
          const l = e.target;
          l.setStyle({ weight: 3, color: "#000", fillOpacity: 0.9 });
          const crop = feature.properties?.cropData?.nilai || 0;
          const trend = feature.properties?.cropData?.trend || "nodata";
          const trendData = feature.properties?.cropData?.trendData || [];
          const percentChange = feature.properties?.cropData?.percentChange || 0;
          const name = feature.properties?.cropData?.nama || "";
          const satuan = feature.properties?.cropData?.satuan || "";
          const kategori = feature.properties?.cropData?.kategori || "";
          
          const trendText = trend === "nodata" ? "Data tidak cukup" :
                          trend === "up" ? "Naik" :
                          trend === "down" ? "Turun" : "Stabil";
          
          const percentChangeFormatted = percentChange !== 0 
            ? `(${percentChange > 0 ? "+" : ""}${percentChange.toFixed(2)}%)` 
            : "";
          
          l.bindTooltip(
            `<strong>${name}</strong><br />
            Produksi ${kategori} Saat Ini: ${crop.toLocaleString("id-ID", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${satuan}<br />
            Tren Kuartal: ${getTrendIcon(trend)} ${trendText} ${percentChangeFormatted}<br />
            <small>${formatTrendData(trendData)}</small>`,
            {
              permanent: false,
              direction: "center",
              className: "custom-tooltip",
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

  const handleQuarterChange = (quarter) => {
    setSelectedQuarter(quarter);
    updateMapData(quarter, selectedCategory);
  };

  const handleCategoryChange = (category) => {
    // Reset data states
    setBpsData(null);
    setHistoricalData({});
    
    // Update selected category
    setSelectedCategory(category);
    
    // Explicitly fetch data with the new category
    fetchBpsData(category);
  };

  const updateMapData = useCallback((quarter, category) => {
    if (geoJsonRef.current && geoData && bpsData) {
      const updated = updateGeoDataWithTrendData(geoData, bpsData, quarter, category);
      geoJsonRef.current.clearLayers();
      geoJsonRef.current.addData(updated);
    }
  }, [geoData, bpsData, updateGeoDataWithTrendData]);

  useEffect(() => {
    if (geoJsonRef.current && geoData && bpsData && Object.keys(historicalData).length > 0) {
      updateMapData(selectedQuarter, selectedCategory);
    }
  }, [bpsData, historicalData, selectedCategory, selectedQuarter, updateMapData]);

  const prepareGeoData = useCallback(() => {
    if (!geoData || !bpsData || Object.keys(historicalData).length === 0) return null;
    return updateGeoDataWithTrendData(geoData, bpsData, selectedQuarter, selectedCategory);
  }, [geoData, bpsData, selectedQuarter, selectedCategory, updateGeoDataWithTrendData, historicalData]);

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
            background: "white",
            padding: "20px",
            borderRadius: "5px",
            boxShadow: "0 0 10px rgba(0,0,0,0.2)"
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
        {geoData && bpsData && Object.keys(historicalData).length > 0 && (
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
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}
      >
        <div>
          <label>Pilih Kategori: </label>
          <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category)}
                style={{
                  padding: "5px 10px",
                  cursor: "pointer",
                  background: selectedCategory.id === category.id ? "#3498DB" : "#f1f1f1",
                  color: selectedCategory.id === category.id ? "white" : "black",
                  border: "1px solid #ddd",
                  borderRadius: "3px",
                  fontWeight: selectedCategory.id === category.id ? "bold" : "normal"
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label>Pilih Kuartal: </label>
          <select
            value={selectedQuarter.id}
            onChange={(e) => {
              const quarter = quarters.find((q) => q.id === parseInt(e.target.value));
              handleQuarterChange(quarter);
            }}
            style={{ marginTop: "5px", padding: "5px", width: "100%" }}
          >
            {quarters.map((quarter) => (
              <option key={quarter.id} value={quarter.id}>
                {quarter.name}
              </option>
            ))}
          </select>
        </div>
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
          boxShadow: "0 0 10px rgba(0,0,0,0.2)"
        }}
      >
        <h4>Tren Produksi {selectedCategory.name} Per Kuartal</h4>
        <div>
          <span
            style={{
              background: "#27AE60",
              width: "20px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>{" "}
          Naik ↗️
        </div>
        <div>
          <span
            style={{
              background: "#E74C3C",
              width: "20px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>{" "}
          Turun ↘️
        </div>
        <div>
          <span
            style={{
              background: "#F1C40F",
              width: "20px",
              height: "10px",
              display: "inline-block",
            }}
          ></span>{" "}
          Stabil →
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
          Data Tidak Cukup
        </div>
        <div style={{ marginTop: "10px", fontSize: "0.8em" }}>
          <i>Catatan: Tren dihitung berdasarkan perbandingan antara kuartal saat ini dan kuartal sebelumnya</i>
        </div>
      </div>

      <style jsx global>{`
        .custom-tooltip {
          background: white;
          border: 1px solid #ccc;
          padding: 5px;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0,0,0,0.2);
          max-width: 300px;
        }
      `}</style>
    </div>
  );
};

export default Map;