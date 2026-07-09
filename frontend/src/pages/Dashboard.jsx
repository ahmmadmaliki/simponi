import {
  Building2,
  Download,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Mock Data
const MOCK_MONTHLY_REVENUE = [
  { name: "Jan", pkb: 4000, bbnkb: 2400 },
  { name: "Feb", pkb: 3000, bbnkb: 1398 },
  { name: "Mar", pkb: 2000, bbnkb: 4800 },
  { name: "Apr", pkb: 2780, bbnkb: 3908 },
  { name: "Mei", pkb: 1890, bbnkb: 4800 },
  { name: "Jun", pkb: 2390, bbnkb: 3800 },
];

import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export default function Dashboard() {
  const [filterTahun, setFilterTahun] = useState(
    new Date().getFullYear().toString(),
  );
  const [filterBulanMulai, setFilterBulanMulai] = useState("Januari");
  const [filterBulanAkhir, setFilterBulanAkhir] = useState("Desember");

  const monthsList = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: [
      "dashboardMetrics",
      filterTahun,
      filterBulanMulai,
      filterBulanAkhir,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        tahun: filterTahun,
        bulanMulai: filterBulanMulai,
        bulanAkhir: filterBulanAkhir,
      }).toString();
      const res = await api.get(`/dashboard/live-metrics?${params}`);
      return res.data;
    },
  });

  const { data: kecamatanData, isLoading: loadingKec } = useQuery({
    queryKey: [
      "dashboardKecamatan",
      filterTahun,
      filterBulanMulai,
      filterBulanAkhir,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        tahun: filterTahun,
        bulanMulai: filterBulanMulai,
        bulanAkhir: filterBulanAkhir,
      }).toString();
      const res = await api.get(`/dashboard/kecamatan?${params}`);
      return res.data;
    },
  });

  const { data: trendData, isLoading: loadingTrend } = useQuery({
    queryKey: [
      "dashboardTrend",
      filterTahun,
      filterBulanMulai,
      filterBulanAkhir,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        tahun: filterTahun,
        bulanMulai: filterBulanMulai,
        bulanAkhir: filterBulanAkhir,
      }).toString();
      const res = await api.get(`/dashboard/trend?${params}`);
      return res.data;
    },
  });

  const targetPkb = Number(metrics?.targetPkb) || 0;
  const targetBbnkb = Number(metrics?.targetBbnkb) || 0;
  const targetTotal = targetPkb + targetBbnkb;

  const realisasiPkb = Number(metrics?.realisasiPkb) || 0;
  const realisasiBbnkb = Number(metrics?.realisasiBbnkb) || 0;

  const pkbPercent = targetPkb > 0 ? (realisasiPkb / targetPkb) * 100 : 0;
  const bbnkbPercent =
    targetBbnkb > 0 ? (realisasiBbnkb / targetBbnkb) * 100 : 0;
  const totalPercent =
    targetTotal > 0 ? ((realisasiPkb + realisasiBbnkb) / targetTotal) * 100 : 0;

  const sisaTarget = targetTotal - (realisasiPkb + realisasiBbnkb);

  const handleDownloadExcel = () => {
    if (!kecamatanData || kecamatanData.length === 0) return;
    const headers = [
      "No",
      "Kecamatan",
      "Target PKB",
      "Realisasi PKB",
      "Target BBNKB",
      "Realisasi BBNKB",
      "Total Realisasi",
    ];
    const rows = kecamatanData.map((d, i) => [
      i + 1,
      d.name,
      d.target || 0,
      d.opsenPkb || 0,
      d.target || 0,
      d.opsenBbnkb || 0,
      (d.opsenPkb || 0) + (d.opsenBbnkb || 0),
    ]);
    const csvContent = [
      headers.join(";"),
      ...rows.map((e) => e.join(";")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Dashboard_Evaluasi_Opsen_${filterTahun}_${filterBulanMulai}-${filterBulanAkhir}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRupiah = (number) => {
    if (Number.isNaN(number)) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">
            Dashboard Evaluasi Target Opsen
          </h2>
          <p className="text-slate-500 mt-1 text-lg md:text-xl">
            Tahun Anggaran 2026
          </p>
        </div>
        <div className="flex flex-col xl:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="flex-1 sm:flex-none pl-4 pr-10 py-3 md:py-4 rounded-xl border border-slate-300 text-base md:text-lg bg-white shadow-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 font-semibold"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
            <div className="flex flex-1 sm:flex-none items-center gap-2 w-full sm:w-auto">
              <select
                value={filterBulanMulai}
                onChange={(e) => setFilterBulanMulai(e.target.value)}
                className="flex-1 pl-4 pr-10 py-3 md:py-4 rounded-xl border border-slate-300 text-base md:text-lg bg-white shadow-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 font-semibold sm:w-40"
              >
                {monthsList.map((m) => (
                  <option key={`start-${m}`} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span className="flex items-center text-slate-500 font-bold">
                -
              </span>
              <select
                value={filterBulanAkhir}
                onChange={(e) => setFilterBulanAkhir(e.target.value)}
                className="flex-1 pl-4 pr-10 py-3 md:py-4 rounded-xl border border-slate-300 text-base md:text-lg bg-white shadow-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 font-semibold sm:w-40"
              >
                {monthsList.map((m) => (
                  <option key={`end-${m}`} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleDownloadExcel}
            className="flex justify-center items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 md:py-4 px-4 md:px-6 rounded-xl shadow-md transition-all text-base md:text-lg w-full sm:w-auto"
          >
            <Download size={20} className="md:w-6 md:h-6" />
            Unduh Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-8 border-t-primary-500 overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-4">
              <p
                className="text-slate-500 font-bold text-lg xl:text-xl uppercase tracking-wider truncate"
                title="Target Opsen PKB"
              >
                Realisasi Opsen PKB
              </p>
              <h3 className="text-3xl xl:text-4xl font-black text-slate-800 mt-2 truncate">
                {formatRupiah(realisasiPkb)}
              </h3>
            </div>
            <div className="bg-primary-100 p-4 rounded-full text-primary-600 shrink-0">
              <Target size={32} />
            </div>
          </div>
          <div className="mt-6">
            <div className="w-full bg-slate-200 rounded-full h-4">
              <div
                className="bg-primary-500 h-4 rounded-full"
                style={{ width: `${Math.min(pkbPercent, 100)}%` }}
              ></div>
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-600">
              Terpenuhi: {pkbPercent.toFixed(1)}% dari {formatRupiah(targetPkb)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-8 border-t-green-500 overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-4">
              <p
                className="text-slate-500 font-bold text-lg xl:text-xl uppercase tracking-wider truncate"
                title="Target Opsen BBNKB"
              >
                Realisasi Opsen BBNKB
              </p>
              <h3 className="text-3xl xl:text-4xl font-black text-slate-800 mt-2 truncate">
                {formatRupiah(realisasiBbnkb)}
              </h3>
            </div>
            <div className="bg-green-100 p-4 rounded-full text-green-600 shrink-0">
              <Target size={32} />
            </div>
          </div>
          <div className="mt-6">
            <div className="w-full bg-slate-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full"
                style={{ width: `${Math.min(bbnkbPercent, 100)}%` }}
              ></div>
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-600">
              Terpenuhi: {bbnkbPercent.toFixed(1)}% dari{" "}
              {formatRupiah(targetBbnkb)}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-8 border-t-orange-500 overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-4">
              <p
                className="text-slate-500 font-bold text-lg xl:text-xl uppercase tracking-wider truncate"
                title="Target Total Opsen"
              >
                Realisasi Total
              </p>
              <h3 className="text-3xl xl:text-4xl font-black text-slate-800 mt-2 truncate">
                {formatRupiah(realisasiPkb + realisasiBbnkb)}
              </h3>
            </div>
            <div className="bg-orange-100 p-4 rounded-full text-orange-600 shrink-0">
              <Target size={32} />
            </div>
          </div>
          <div className="mt-6">
            <div className="w-full bg-slate-200 rounded-full h-4">
              <div
                className="bg-orange-500 h-4 rounded-full"
                style={{ width: `${Math.min(totalPercent, 100)}%` }}
              ></div>
            </div>
            <p className="mt-3 text-lg font-semibold text-slate-600">
              Terpenuhi: {totalPercent.toFixed(1)}% dari{" "}
              {formatRupiah(targetTotal)}
            </p>
          </div>
        </div>

        <div className="bg-primary-800 p-6 rounded-2xl shadow-lg border border-primary-900 border-t-8 border-t-yellow-400 text-white overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-4">
              <p
                className="text-primary-200 font-bold text-lg xl:text-xl uppercase tracking-wider truncate"
                title="Estimasi Sisa Target Keseluruhan"
              >
                Sisa Target Total
              </p>
              <h3 className="text-4xl xl:text-4xl font-black mt-3 text-yellow-400 drop-shadow-md truncate">
                {formatRupiah(Math.max(sisaTarget, 0))}
              </h3>
            </div>
            <div className="bg-primary-700/50 p-4 rounded-full text-yellow-400 shrink-0">
              <TrendingDown size={32} />
            </div>
          </div>
          <div className="mt-6">
            <p className="text-lg font-medium text-primary-100 truncate">
              Evaluasi akhir tahun
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <TrendingUp className="text-primary-600" size={28} />
            Trend Realisasi (Dalam Juta Rupiah)
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData || []}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 16 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 16 }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="pkb"
                  name="PKB"
                  stroke="#e11d48"
                  fill="#e11d48"
                  fillOpacity={0.2}
                  strokeWidth={4}
                />
                <Area
                  type="monotone"
                  dataKey="bbnkb"
                  name="BBNKB"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                  strokeWidth={4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <Building2 className="text-primary-600" size={28} />
            Realisasi per Kecamatan
          </h3>

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-slate-100 rounded-xl relative shadow-inner">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b-2 border-slate-200">
                <tr>
                  <th className="p-4 text-base font-bold text-slate-700 bg-slate-50 whitespace-nowrap">
                    Kecamatan
                  </th>
                  <th className="p-4 text-base font-bold text-slate-700 bg-slate-50 whitespace-nowrap">
                    PKB Pokok
                  </th>
                  <th className="p-4 text-base font-bold text-slate-700 bg-slate-50 whitespace-nowrap">
                    Opsen PKB
                  </th>
                  <th className="p-4 text-base font-bold text-slate-700 bg-slate-50 whitespace-nowrap">
                    BBNKB Pokok
                  </th>
                  <th className="p-4 text-base font-bold text-slate-700 bg-slate-50 whitespace-nowrap">
                    Opsen BBNKB
                  </th>
                  <th className="p-4 text-base font-bold text-slate-700 bg-slate-50 whitespace-nowrap">
                    Total Realisasi Opsen
                  </th>
                  <th className="p-4 text-base font-bold text-slate-700 bg-slate-50 whitespace-nowrap">
                    Presentase
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingKec ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="p-8 text-center text-slate-500 text-lg font-bold"
                    >
                      Memuat Data Kecamatan..
                    </td>
                  </tr>
                ) : (
                  (kecamatanData || []).map((item) => {
                    const totalRealisasiOpsen = item.opsenPkb + item.opsenBbnkb;
                    const percent = (totalRealisasiOpsen / item.target) * 100;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-primary-50 transition-colors"
                      >
                        <td className="p-4 text-lg font-bold text-slate-800 whitespace-nowrap">
                          {item.name}
                        </td>
                        <td className="p-4 text-base text-slate-600 whitespace-nowrap">
                          {formatRupiah(item.pkbPokok)}
                        </td>
                        <td className="p-4 text-base text-primary-700 font-semibold whitespace-nowrap">
                          {formatRupiah(item.opsenPkb)}
                        </td>
                        <td className="p-4 text-base text-slate-600 whitespace-nowrap">
                          {formatRupiah(item.bbnkbPokok)}
                        </td>
                        <td className="p-4 text-base text-green-700 font-semibold whitespace-nowrap">
                          {formatRupiah(item.opsenBbnkb)}
                        </td>
                        <td className="p-4 text-base font-bold text-slate-800 whitespace-nowrap">
                          {formatRupiah(totalRealisasiOpsen)}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold ${
                              percent >= 100
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {percent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
