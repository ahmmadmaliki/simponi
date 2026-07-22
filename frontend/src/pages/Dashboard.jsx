import {
  Building2,
  Download,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
import LoadingSpinner from "../components/LoadingSpinner";

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

  const { data: kecamatanResponse, isLoading: loadingKec } = useQuery({
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

  const kecamatanData = kecamatanResponse?.data || [];
  const lastSyncDate = kecamatanResponse?.lastSync || null;

  const totalPKBPokok = kecamatanData.reduce(
    (acc, curr) => acc + (curr.pkbPokok || 0),
    0,
  );
  const totalOpsenPKB = kecamatanData.reduce(
    (acc, curr) => acc + (curr.opsenPkb || 0),
    0,
  );
  const totalBBNKBPokok = kecamatanData.reduce(
    (acc, curr) => acc + (curr.bbnkbPokok || 0),
    0,
  );
  const totalOpsenBBNKB = kecamatanData.reduce(
    (acc, curr) => acc + (curr.opsenBbnkb || 0),
    0,
  );
  const grandTotalOpsen = totalOpsenPKB + totalOpsenBBNKB;

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
      "PKB Pokok",
      "Opsen PKB",
      "BBNKB Pokok",
      "Opsen BBNKB",
      "Total Realisasi Opsen",
    ];
    const rows = kecamatanData.map((d, i) => [
      i + 1,
      d.name,
      Math.round(d.pkbPokok || 0),
      Math.round(d.opsenPkb || 0),
      Math.round(d.bbnkbPokok || 0),
      Math.round(d.opsenBbnkb || 0),
      Math.round((d.opsenPkb || 0) + (d.opsenBbnkb || 0)),
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
            Tahun Anggaran {filterTahun}
          </p>
        </div>
        <div className="flex flex-col xl:flex-row items-start xl:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <select
              value={filterTahun}
              onChange={(e) => setFilterTahun(e.target.value)}
              className="w-full sm:w-auto pl-4 pr-10 py-2.5 md:py-3 rounded-xl border border-slate-300 text-sm md:text-base bg-white shadow-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 font-semibold"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterBulanMulai}
                onChange={(e) => setFilterBulanMulai(e.target.value)}
                className="flex-1 pl-4 pr-8 py-2.5 md:py-3 rounded-xl border border-slate-300 text-sm md:text-base bg-white shadow-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 font-semibold sm:w-36 md:w-40"
              >
                {monthsList.map((m) => (
                  <option key={`start-${m}`} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span className="text-slate-500 font-bold">-</span>
              <select
                value={filterBulanAkhir}
                onChange={(e) => setFilterBulanAkhir(e.target.value)}
                className="flex-1 pl-4 pr-8 py-2.5 md:py-3 rounded-xl border border-slate-300 text-sm md:text-base bg-white shadow-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 font-semibold sm:w-36 md:w-40"
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
            className="flex justify-center items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 md:py-3 px-4 md:px-6 rounded-xl shadow-md transition-all text-sm md:text-base w-full xl:w-auto h-fit whitespace-nowrap"
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
                {loadingMetrics ? (
                  <LoadingSpinner size={24} className="inline-flex" />
                ) : (
                  formatRupiah(realisasiPkb)
                )}
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
              Terpenuhi:{" "}
              {loadingMetrics ? (
                <LoadingSpinner size={16} className="inline-flex" />
              ) : (
                pkbPercent.toFixed(1)
              )}
              % dari Target{" "}
              {loadingMetrics ? (
                <LoadingSpinner size={16} className="inline-flex" />
              ) : (
                formatRupiah(targetPkb)
              )}
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
                {loadingMetrics ? (
                  <LoadingSpinner size={24} className="inline-flex" />
                ) : (
                  formatRupiah(realisasiBbnkb)
                )}
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
              Terpenuhi:{" "}
              {loadingMetrics ? (
                <LoadingSpinner size={16} className="inline-flex" />
              ) : (
                bbnkbPercent.toFixed(1)
              )}
              % dari Target{" "}
              {loadingMetrics ? (
                <LoadingSpinner size={16} className="inline-flex" />
              ) : (
                formatRupiah(targetBbnkb)
              )}
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
                {loadingMetrics ? (
                  <LoadingSpinner size={24} className="inline-flex" />
                ) : (
                  formatRupiah(realisasiPkb + realisasiBbnkb)
                )}
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
              Terpenuhi:{" "}
              {loadingMetrics ? (
                <LoadingSpinner size={16} className="inline-flex" />
              ) : (
                totalPercent.toFixed(1)
              )}
              % dari Target{" "}
              {loadingMetrics ? (
                <LoadingSpinner size={16} className="inline-flex" />
              ) : (
                formatRupiah(targetTotal)
              )}
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
                Sisa Target yang Harus Dicapai
              </p>
              <h3 className="text-4xl xl:text-4xl font-black mt-3 text-yellow-400 drop-shadow-md truncate">
                {loadingMetrics ? (
                  <LoadingSpinner
                    size={24}
                    className="inline-flex text-yellow-400"
                  />
                ) : (
                  formatRupiah(Math.max(sisaTarget, 0))
                )}
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
            Tingkat Realisasi Opsen (Dalam Miliar)
          </h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={(trendData || []).map((d) => ({
                  ...d,
                  pkb: (d.pkb || 0) / 1000,
                  bbnkb: (d.bbnkb || 0) / 1000,
                  totalOpsen: ((d.pkb || 0) + (d.bbnkb || 0)) / 1000,
                }))}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 16, fontWeight: 500 }}
                  dy={15}
                />
                <YAxis
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("id-ID", {
                      maximumFractionDigits: 0,
                    }).format(value)
                  }
                  tick={{ fontSize: 16 }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const formattedValue = new Intl.NumberFormat("id-ID", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    }).format(value);

                    let percentage = 0;
                    const valueInRp = value * 1000000000;

                    if (name === "Opsen PKB" && targetPkb > 0) {
                      percentage = Math.round((valueInRp / targetPkb) * 100);
                      return [`${formattedValue} (${percentage}%)`, name];
                    } else if (name === "Opsen BBNKB" && targetBbnkb > 0) {
                      percentage = Math.round((valueInRp / targetBbnkb) * 100);
                      return [`${formattedValue} (${percentage}%)`, name];
                    } else if (name === "Total Opsen" && targetTotal > 0) {
                      percentage = Math.round((valueInRp / targetTotal) * 100);
                      return [`${formattedValue} (${percentage}%)`, name];
                    }

                    return [formattedValue, name];
                  }}
                  contentStyle={{
                    borderRadius: "12px",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <Bar
                  dataKey="pkb"
                  name="Opsen PKB"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Bar
                  dataKey="bbnkb"
                  name="Opsen BBNKB"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Line
                  type="monotone"
                  dataKey="totalOpsen"
                  name="Total Opsen"
                  stroke="#f59e0b"
                  strokeWidth={4}
                  dot={{
                    r: 6,
                    fill: "#f59e0b",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 8 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Building2 className="text-primary-600" size={28} />
              Realisasi per Kecamatan
            </h3>
            {lastSyncDate && (
              <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100 whitespace-nowrap">
                Data s.d.{" "}
                {new Date(lastSyncDate).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl relative shadow-inner">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
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
                      <LoadingSpinner
                        size={32}
                        className="justify-center"
                        text="Memuat data kecamatan..."
                      />
                    </td>
                  </tr>
                ) : (
                  (kecamatanData || []).map((item) => {
                    const totalRealisasiOpsen = item.opsenPkb + item.opsenBbnkb;
                    const percent =
                      grandTotalOpsen > 0
                        ? (totalRealisasiOpsen / grandTotalOpsen) * 100
                        : 0;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-primary-50 transition-colors"
                      >
                        <td className="px-4 py-2.5 text-lg font-bold text-slate-800 whitespace-nowrap">
                          {item.name}
                        </td>
                        <td className="px-4 py-2.5 text-base text-slate-600 whitespace-nowrap">
                          {formatRupiah(item.pkbPokok)}
                        </td>
                        <td className="px-4 py-2.5 text-base text-primary-700 font-semibold whitespace-nowrap">
                          {formatRupiah(item.opsenPkb)}
                        </td>
                        <td className="px-4 py-2.5 text-base text-slate-600 whitespace-nowrap">
                          {formatRupiah(item.bbnkbPokok)}
                        </td>
                        <td className="px-4 py-2.5 text-base text-green-700 font-semibold whitespace-nowrap">
                          {formatRupiah(item.opsenBbnkb)}
                        </td>
                        <td className="px-4 py-2.5 text-base font-bold text-slate-800 whitespace-nowrap">
                          {formatRupiah(totalRealisasiOpsen)}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
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
              {kecamatanData.length > 0 && !loadingKec && (
                <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                  <tr>
                    <th className="p-4 text-base font-extrabold text-slate-800 bg-slate-100 whitespace-nowrap uppercase tracking-wider">
                      TOTAL KESELURUHAN
                    </th>
                    <th className="p-4 text-base font-bold text-slate-800 bg-slate-100 whitespace-nowrap">
                      {formatRupiah(totalPKBPokok)}
                    </th>
                    <th className="p-4 text-base font-bold text-primary-700 bg-slate-100 whitespace-nowrap">
                      {formatRupiah(totalOpsenPKB)}
                    </th>
                    <th className="p-4 text-base font-bold text-slate-800 bg-slate-100 whitespace-nowrap">
                      {formatRupiah(totalBBNKBPokok)}
                    </th>
                    <th className="p-4 text-base font-bold text-green-700 bg-slate-100 whitespace-nowrap">
                      {formatRupiah(totalOpsenBBNKB)}
                    </th>
                    <th className="p-4 text-base font-bold text-slate-800 bg-slate-100 whitespace-nowrap">
                      {formatRupiah(grandTotalOpsen)}
                    </th>
                    <th className="p-4 text-base font-bold text-slate-800 bg-slate-100 whitespace-nowrap">
                      100%
                    </th>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
