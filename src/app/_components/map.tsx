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
  { id: "Beras", name: "Beras (GKG)", code: "2506" },
];

const quarters = [
  {
    id: 1,
    name: "Kuartal 1 (Jan-Mar)",
    months: months.filter((m) => m.quarter === 1),
  },
  {
    id: 2,
    name: "Kuartal 2 (Apr-Jun)",
    months: months.filter((m) => m.quarter === 2),
  },
  {
    id: 3,
    name: "Kuartal 3 (Jul-Sep)",
    months: months.filter((m) => m.quarter === 3),
  },
  {
    id: 4,
    name: "Kuartal 4 (Okt-Des)",
    months: months.filter((m) => m.quarter === 4),
  },
];

const Map = () => {
  const [geoData, setGeoData] = useState(null);
  const [bpsData, setBpsData] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [historicalData, setHistoricalData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    let currentQuarterId =
      currentMonth <= 3 ? 1 : currentMonth <= 6 ? 2 : currentMonth <= 9 ? 3 : 4;
    return quarters.find((q) => q.id === currentQuarterId) || quarters[0];
  });
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const geoJsonRef = useRef(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsClient(true);
    }
  }, []);

  const API_KEY = "5065bedad441b6074ff02c53c82931c9";
  const GEMINI_API_KEY = "AIzaSyAFQOp80HiW3Xd2W71madfy8CkBY7tEo_Y";

  const fetchBpsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `https://webapi.bps.go.id/v1/api/list/model/data/lang/ind/domain/0000/var/2506/key/${API_KEY}`
      );
      const data = await res.json();
      if (data.status === "OK" && data["data-availability"] === "available") {
        setBpsData(data);
        const historicalDataObj = {};
        months.forEach((month) => {
          historicalDataObj[month.code] = extractDataFromBpsResponse(
            data,
            month.code
          );
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
  }, []);

  const fetchPriceData = useCallback(async () => {
    try {
      const res = await fetch(
        "https://api-panelhargav2.badanpangan.go.id/api/front/harga-peta-provinsi?level_harga_id=3&komoditas_id=109&period_date=24%2F05%2F2025%20-%2024%2F05%2F2025&multi_status_map[0]=&multi_province_id[0]="
      );
      const data = await res.json();
      if (data.status === "success") {
        setPriceData(data);
      } else {
        setPriceData(null);
      }
    } catch (err) {
      console.error("Fetch Price API error:", err);
      setPriceData(null);
    }
  }, []);

  const fetchGeminiAnalysis = async (cropData) => {
    setIsAnalyzing(true);
    try {
      const prompt = `
        Anda adalah asisten AI yang menganalisis data produksi dan harga beras di suatu provinsi di Indonesia. Berikut adalah data untuk provinsi ${cropData.nama}:
        - Produksi Beras (GKG) Saat Ini: ${cropData.nilai.toLocaleString("id-ID")} Ton
        - Tren Produksi: ${cropData.trend === "up" ? "Naik" : cropData.trend === "down" ? "Turun" : cropData.trend === "stable" ? "Stabil" : "Data Tidak Cukup"} (${cropData.percentChange.toFixed(2)}%)
        - Harga Beras SPHP: Rp${cropData.price.toLocaleString("id-ID")} / kg
        - Status Harga: ${cropData.priceStatus} (${cropData.priceHppHapPercentage.toFixed(2)}% dari HET Rp${parseInt(cropData.priceHppHap).toLocaleString("id-ID")})
        - Zona Harga: ${cropData.zoneName}

        Berikan analisis singkat (maksimal 100 kata) untuk membantu pengambilan keputusan terkait produksi dan harga beras di provinsi ini. Pertimbangkan tren produksi, harga, dan status harga untuk memberikan rekomendasi, seperti apakah provinsi ini cocok untuk investasi, strategi pemasaran, atau kebijakan stabilisasi harga.
      `;

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      if (data.candidates && data.candidates[0].content) {
        setAiAnalysis(data.candidates[0].content.parts[0].text);
      } else {
        setAiAnalysis("Gagal mengambil analisis dari Gemini API.");
      }
    } catch (err) {
      console.error("Gemini API error:", err);
      setAiAnalysis("Terjadi kesalahan saat mengambil analisis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractDataFromBpsResponse = useCallback((data, monthCode) => {
    const result = {};
    if (!data || !data.datacontent || !data.vervar) return result;

    Object.keys(data.vervar).forEach((index) => {
      const provCode = data.vervar[index].val;
      if (provCode === "9999") return;

      const key = `${provCode}25060125${monthCode}`;
      if (data.datacontent[key]) {
        result[provCode] = parseFloat(data.datacontent[key]);
      }
    });

    return result;
  }, []);

  const calculateTrend = useCallback(
    (provinceCode, currentQuarter) => {
      const previousQuarter = currentQuarter - 1;
      if (previousQuarter < 1) {
        return { trend: "nodata", data: [] };
      }

      const currentQuarterMonths = months.filter(
        (m) => m.quarter === currentQuarter
      );
      const previousQuarterMonths = months.filter(
        (m) => m.quarter === previousQuarter
      );

      let currentQuarterTotal = 0;
      let currentQuarterMonthsWithData = 0;
      currentQuarterMonths.forEach((month) => {
        const value = historicalData[month.code]?.[provinceCode] || 0;
        if (value > 0) {
          currentQuarterTotal += value;
          currentQuarterMonthsWithData++;
        }
      });

      let previousQuarterTotal = 0;
      let previousQuarterMonthsWithData = 0;
      previousQuarterMonths.forEach((month) => {
        const value = historicalData[month.code]?.[provinceCode] || 0;
        if (value > 0) {
          previousQuarterTotal += value;
          previousQuarterMonthsWithData++;
        }
      });

      if (
        currentQuarterMonthsWithData === 0 ||
        previousQuarterMonthsWithData === 0
      ) {
        return { trend: "nodata", data: [] };
      }

      const currentQuarterAvg =
        currentQuarterTotal / currentQuarterMonthsWithData;
      const previousQuarterAvg =
        previousQuarterTotal / previousQuarterMonthsWithData;

      const percentChange =
        ((currentQuarterAvg - previousQuarterAvg) / previousQuarterAvg) * 100;

      let trend;
      if (percentChange > 5) trend = "up";
      else if (percentChange < -5) trend = "down";
      else trend = "stable";

      const quarterData = [
        {
          quarter: previousQuarter,
          value: previousQuarterAvg,
          total: previousQuarterTotal,
          months: previousQuarterMonthsWithData,
        },
        {
          quarter: currentQuarter,
          value: currentQuarterAvg,
          total: currentQuarterTotal,
          months: currentQuarterMonthsWithData,
        },
      ];

      return {
        trend,
        data: quarterData,
        percentChange: percentChange,
      };
    },
    [historicalData]
  );

  const normalizeProvinceCode = (code) => {
    const codeMap = {
      "1100": "ID-AC",
      "1200": "ID-SU",
      "1300": "ID-SB",
      "1400": "ID-RI",
      "1500": "ID-JA",
      "1600": "ID-SS",
      "1700": "ID-BE",
      "1800": "ID-LA",
      "1900": "ID-KR",
      "3100": "ID-JK",
      "3200": "ID-JB",
      "3300": "ID-JT",
      "3400": "ID-YO",
      "3500": "ID-JI",
      "3600": "ID-BT",
      "5100": "ID-BA",
      "5200": "ID-NT",
      "5300": "ID-NB",
      "6100": "ID-KB",
      "6200": "ID-KT",
      "6300": "ID-KS",
      "6400": "ID-KI",
      "6500": "ID-KU",
      "7100": "ID-SA",
      "7200": "ID-ST",
      "7300": "ID-SN",
      "7400": "ID-SG",
      "7500": "ID-GO",
      "7600": "ID-SR",
      "8100": "ID-MA",
      "8200": "ID-MU",
      "9100": "ID-PA",
      "9200": "ID-PB",
      "9300": "ID-PT",
      "9400": "ID-PS",
      "9500": "ID-PP",
      "9700": "ID-PD",
    };
    return codeMap[code] || code;
  };

  const getZoneForProvince = (provinceId, settingHarga) => {
    const zoneMapping = {
      11: "Zona 1",
      12: "Zona 1",
      13: "Zona 1",
      14: "Zona 1",
      15: "Zona 1",
      16: "Zona 1",
      17: "Zona 1",
      1: "Zona 2",
      2: "Zona 2",
      3: "Zona 2",
      4: "Zona 2",
      5: "Zona 2",
      6: "Zona 2",
      7: "Zona 2",
      8: "Zona 2",
      10: "Zona 2",
      20: "Zona 2",
      21: "Zona 2",
      22: "Zona 2",
      23: "Zona 2",
      24: "Zona 2",
      25: "Zona 2",
      27: "Zona 2",
      28: "Zona 2",
      29: "Zona 2",
      19: "Zona 3",
      31: "Zona 3",
      34: "Zona 3",
      35: "Zona 3",
      38: "Zona 3",
    };
    const zoneName = zoneMapping[provinceId] || "Nasional";
    const zoneData = settingHarga?.find((z) => z.nama_zona === zoneName) || 
                    settingHarga?.find((z) => z.nama_zona === "Nasional") || 
                    { harga_provinsi: "12500", nama_zona: "Nasional" };
    return zoneData;
  };

  const updateGeoDataWithTrendData = useCallback(
    (geo, bps, quarterObj) => {
      if (!geo || !bps || Object.keys(historicalData).length === 0 || !priceData) {
        return geo;
      }

      const cloned = JSON.parse(JSON.stringify(geo));
      const lastMonthInQuarter =
        quarterObj.months[quarterObj.months.length - 1];
      const currentDataByProvince = extractDataFromBpsResponse(
        bps,
        lastMonthInQuarter.code
      );

      cloned.features.forEach((feature, index) => {
        try {
          const code = feature.properties.kode || feature.properties.REGION_CODE;
          if (code === "9999") return;

          const normalizedCode = normalizeProvinceCode(code);
          const currentValue = currentDataByProvince[code] || 0;
          const { trend, data, percentChange } = calculateTrend(code, quarterObj.id);

          const priceInfo = priceData?.data?.find(
            (d) => d.province_kode === normalizedCode
          ) || { rata_rata_geometrik: 0, status_map: "Data Tidak Tersedia", hpp_hap_percentage: 0, hpp_hap_percentage_gap_change: "no_change", province_id: 0 };
          const provinceId = priceInfo.province_id || parseInt(code.replace(/\D/g, ""), 10) || 0;
          const zoneInfo = priceData?.request_data?.setting_harga
            ? getZoneForProvince(provinceId, priceData.request_data.setting_harga)
            : { harga_provinsi: "12500", nama_zona: "Nasional" };

          feature.properties.cropData = {
            nilai: currentValue,
            trendData: data,
            trend: trend,
            percentChange: percentChange || 0,
            satuan: "Ton",
            nama: feature.properties.name || feature.properties.nama,
            kategori: "Beras (GKG)",
            price: parseFloat(priceInfo.rata_rata_geometrik) || 12500,
            priceStatus: priceInfo.status_map || "Data Tidak Tersedia",
            priceHppHap: zoneInfo.harga_provinsi || "12500",
            priceHppHapPercentage: priceInfo.hpp_hap_percentage || 0,
            priceHppHapPercentageGapChange: priceInfo.hpp_hap_percentage_gap_change || "no_change",
            priceSatuan: "Rp/kg",
            priceKomoditas: priceData?.request_data?.komoditas_desc || "Beras SPHP",
            zoneName: zoneInfo.nama_zona || "Tidak Diketahui",
          };
        } catch (error) {
          console.error(`Error processing province ${index + 1}:`, error);
        }
      });

      return cloned;
    },
    [extractDataFromBpsResponse, calculateTrend, historicalData, priceData]
  );

  const updateMapData = useCallback(
    (quarter) => {
      if (geoJsonRef.current && geoData && bpsData && priceData) {
        const updated = updateGeoDataWithTrendData(geoData, bpsData, quarter);
        geoJsonRef.current.clearLayers();
        geoJsonRef.current.addData(updated);
      }
    },
    [geoData, bpsData, priceData, updateGeoDataWithTrendData]
  );

  useEffect(() => {
    fetchBpsData();
    fetchPriceData();
  }, [fetchBpsData, fetchPriceData]);

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

  useEffect(() => {
    if (priceData && geoData && bpsData) {
      updateMapData(selectedQuarter);
    }
  }, [priceData, geoData, bpsData, selectedQuarter, updateMapData]);

  const getColor = (trend) => {
    switch (trend) {
      case "up":
        return "#27AE60";
      case "down":
        return "#E74C3C";
      case "stable":
        return "#F1C40F";
      case "nodata":
      default:
        return "#E5E5E5";
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

    return data
      .map((quarter) => {
        return `Kuartal ${quarter.quarter}: ${quarter.total.toLocaleString(
          "id-ID",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )} Ton (${quarter.months} bulan)`;
      })
      .join("<br />");
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

  const getStatusIcon = (status, gapChange) => {
    if (status === "Tidak Ada Data" || status === "Data Tidak Tersedia") return "❓";
    switch (gapChange) {
      case "up":
        return "↗️";
      case "down":
        return "↘️";
      case "no_change":
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
          const cropData = feature.properties?.cropData || {};
          const {
            nilai: crop = 0,
            trend = "nodata",
            trendData = [],
            percentChange = 0,
            nama = "",
            satuan = "Ton",
            kategori = "Beras (GKG)",
            price = 0,
            priceStatus = "Data Tidak Tersedia",
            priceHppHap = "0",
            priceHppHapPercentage = 0,
            priceHppHapPercentageGapChange = "no_change",
            priceSatuan = "Rp/kg",
            priceKomoditas = "Beras SPHP",
            zoneName = "Tidak Diketahui",
          } = cropData;

          const trendText =
            trend === "nodata"
              ? "Data tidak cukup"
              : trend === "up"
              ? "Naik"
              : trend === "down"
              ? "Turun"
              : "Stabil";

          const percentChangeFormatted =
            percentChange !== 0
              ? `(${percentChange > 0 ? "+" : ""}${percentChange.toFixed(2)}%)`
              : "";

          const pricePercentChangeFormatted =
            priceHppHapPercentage !== 0
              ? `(${priceHppHapPercentage > 0 ? "+" : ""}${priceHppHapPercentage.toFixed(2)}%)`
              : "";

          l.bindTooltip(
            `<strong>${nama}</strong><br />
            Produksi ${kategori} Saat Ini: ${crop.toLocaleString("id-ID", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${satuan}<br />
            Tren Kuartal: ${getTrendIcon(
              trend
            )} ${trendText} ${percentChangeFormatted}<br />
            <small>${formatTrendData(trendData)}</small><br />
            <hr style="border-top: 1px solid #e5e7eb; margin: 8px 0;" />
            Harga ${priceKomoditas}: ${price.toLocaleString(
              "id-ID"
            )} ${priceSatuan}<br />
            Zona: ${zoneName}<br />
            Status Harga: ${getStatusIcon(
              priceStatus,
              priceHppHapPercentageGapChange
            )} ${priceStatus} ${pricePercentChangeFormatted}<br />
            HET: ${parseInt(priceHppHap).toLocaleString(
              "id-ID"
            )} ${priceSatuan}<br />`,
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
        click: () => {
          setSelectedProvince(feature.properties?.cropData || {});
          setAiAnalysis("");
          fetchGeminiAnalysis(feature.properties?.cropData || {});
        },
      });
    },
    [geoJSONStyle]
  );

  const handleQuarterChange = (quarter) => {
    setSelectedQuarter(quarter);
    updateMapData(quarter);
  };

  const prepareGeoData = useCallback(() => {
    if (!geoData || !bpsData || Object.keys(historicalData).length === 0 || !priceData) {
      return null;
    }
    return updateGeoDataWithTrendData(geoData, bpsData, selectedQuarter);
  }, [geoData, bpsData, selectedQuarter, updateGeoDataWithTrendData, historicalData, priceData]);

  if (!isClient) return <div>Loading map...</div>;

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-auto flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-700 font-medium">Memuat data...</p>
          </div>
        </div>
      )}
      <MapContainer
        center={[-2.5, 118]}
        zoom={5}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {geoData && bpsData && Object.keys(historicalData).length > 0 && priceData && (
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
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          maxWidth: "20rem",
          width: "100%",
        }}
      >
        <div>
          <button
            onClick={() => window.history.back()}
            style={{
              padding: "0.5rem 0.75rem",
              fontSize: "0.875rem",
              borderRadius: "0.375rem",
              backgroundColor: "#10b981",
              color: "white",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              marginBottom: "0.75rem",
              transition: "background-color 0.2s",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#059669")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#10b981")}
          >
            ← Kembali
          </button>

          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "#1f2937",
              marginBottom: "0.75rem",
              paddingBottom: "0.5rem",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            Peta Produksi Beras (GKG) dan Harga
          </h3>
        </div>
        <div>
          <label>Pilih Kuartal: </label>
          <select
            value={selectedQuarter.id}
            onChange={(e) => {
              const quarter = quarters.find(
                (q) => q.id === parseInt(e.target.value)
              );
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
          boxShadow: "0 0 10px rgba(0,0,0,0.2)",
        }}
      >
        <h4
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "#1f2937",
            marginBottom: "0.75rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          Tren Produksi Beras (GKG) Per Kuartal
        </h4>
        <div>
          <span
            style={{
              width: "20px",
              height: "10px",
              display: "inline-block",
              borderRadius: "0.25rem",
              backgroundColor: "#27AE60",
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
          <i>
            Catatan: Tren dihitung berdasarkan perbandingan antara kuartal saat
            ini dan kuartal sebelumnya
          </i>
        </div>
      </div>

      {selectedProvince && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 1000,
            background: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
            maxWidth: "400px",
            width: "100%",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1f2937" }}>
              {selectedProvince.nama || "Provinsi"}
            </h3>
            <button
              onClick={() => setSelectedProvince(null)}
              style={{
                padding: "5px 10px",
                fontSize: "0.875rem",
                borderRadius: "0.375rem",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Tutup
            </button>
          </div>
          <hr style={{ borderTop: "1px solid #e5e7eb", margin: "10px 0" }} />
          <div style={{ fontSize: "0.9rem", color: "#1f2937", lineHeight: "1.5" }}>
            <p><strong>Produksi Beras (GKG):</strong> {selectedProvince.nilai.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedProvince.satuan}</p>
            <p><strong>Tren Produksi:</strong> {getTrendIcon(selectedProvince.trend)} {selectedProvince.trend === "up" ? "Naik" : selectedProvince.trend === "down" ? "Turun" : selectedProvince.trend === "stable" ? "Stabil" : "Data Tidak Cukup"} ({selectedProvince.percentChange.toFixed(2)}%)</p>
            <p><strong>Data Tren:</strong><br /><span dangerouslySetInnerHTML={{ __html: formatTrendData(selectedProvince.trendData) }} /></p>
            <p><strong>Harga {selectedProvince.priceKomoditas}:</strong> Rp{selectedProvince.price.toLocaleString("id-ID")} / {selectedProvince.priceSatuan}</p>
            <p><strong>Zona Harga:</strong> {selectedProvince.zoneName}</p>
            <p><strong>Status Harga:</strong> {getStatusIcon(selectedProvince.priceStatus, selectedProvince.priceHppHapPercentageGapChange)} {selectedProvince.priceStatus} ({selectedProvince.priceHppHapPercentage.toFixed(2)}%)</p>
            <p><strong>HET:</strong> Rp{parseInt(selectedProvince.priceHppHap).toLocaleString("id-ID")} / {selectedProvince.priceSatuan}</p>
          </div>
          <hr style={{ borderTop: "1px solid #e5e7eb", margin: "10px 0" }} />
          <div>
            <h4 style={{ fontSize: "1rem", fontWeight: 600, color: "#1f2937", marginBottom: "10px" }}>
              Analisis AI
            </h4>
            {isAnalyzing ? (
              <p style={{ color: "#64748b", fontStyle: "italic" }}>Menganalisis data...</p>
            ) : (
              <p style={{ fontSize: "0.9rem", color: "#1f2937", lineHeight: "1.5" }}>
                {aiAnalysis || "Belum ada analisis tersedia."}
              </p>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-tooltip {
          background: rgba(255, 255, 255, 0.95);
          border: none;
          borderRadius: 8px;
          padding: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
          max-width: 300px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          lineHeight: 1.5;
        }

        .custom-tooltip strong {
          font-size: 16px;
          display: block;
          margin-bottom: 6px;
          color: #1e293b;
        }

        .custom-tooltip small {
          display: block;
          margin-top: 8px;
          font-size: 12px;
          color: #64748b;
        }
      `}</style>
    </div>
  );
};

export default Map;