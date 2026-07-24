import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Download, Search } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../api/axios";

export default function Evaluasi() {
  const [opsenType, setOpsenType] = useState("PKB");
  const [tahun1, setTahun1] = useState("2026");
  const [tahun2, setTahun2] = useState("2025");

  const [inputOpsenType, setInputOpsenType] = useState("PKB");
  const [inputTahun1, setInputTahun1] = useState("2026");
  const [inputTahun2, setInputTahun2] = useState("2025");

  const handleApplyFilter = () => {
    setOpsenType(inputOpsenType);
    setTahun1(inputTahun1);
    setTahun2(inputTahun2);
  };

  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ["evaluasiKomparasi", tahun1, tahun2, opsenType],
    queryFn: async () => {
      const params = new URLSearchParams({
        tahun1,
        tahun2,
        opsenType,
      }).toString();
      const res = await api.get(`/evaluasi/live-komparasi?${params}`);
      return res.data;
    },
  });

  const handleDownloadExcel = () => {
    if (!comparisonData || comparisonData.length === 0) return;
    const headers = [
      "Periode",
      `Realisasi ${tahun2} (Juta Rp)`,
      `Realisasi ${tahun1} (Juta Rp)`,
      "Pertumbuhan (%)",
    ];
    const rows = comparisonData.map((item) => {
      const growth = item[tahun1]
        ? (((item[tahun1] - item[tahun2]) / item[tahun2]) * 100).toFixed(1)
        : "-";
      return [
        item.name,
        item[tahun2],
        item[tahun1] || "Belum Berjalan",
        growth,
      ];
    });

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
      `Komparasi_${opsenType}_${tahun1}_vs_${tahun2}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl animate-pulse shadow-md">
          🟢 Tersinkronisasi Live Jatim
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800">
          Evaluasi & Analisis Komparatif (YoY)
        </h2>
        <p className="text-slate-500 mt-2 text-xl">
          Perbandingan capaian penerimaan opsen tahun ini dengan tahun
          sebelumnya.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-primary-50 p-6 rounded-2xl shadow-inner border border-primary-100 flex flex-col lg:flex-row gap-6 items-end">
        <div className="flex-1 w-full relative">
          <label className="block text-lg font-bold text-primary-900 mb-2">
            Jenis Penerimaan Opsen
          </label>
          <select
            value={inputOpsenType}
            onChange={(e) => setInputOpsenType(e.target.value)}
            className="w-full pl-5 pr-10 py-4 rounded-xl border border-slate-300 text-lg bg-white shadow-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 font-bold text-slate-800"
          >
            <option value="PKB">Opsen PKB</option>
            <option value="BBNKB">Opsen BBNKB</option>
            <option value="TOTAL">Total Keseluruhan</option>
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-lg font-bold text-primary-900 mb-2">
            Tahun Perbandingan
          </label>
          <div className="flex items-center gap-3">
            <select
              value={inputTahun1}
              onChange={(e) => setInputTahun1(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-slate-300 text-lg bg-white font-bold text-slate-800"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
            <span className="text-primary-800 font-bold px-2">VS</span>
            <select
              value={inputTahun2}
              onChange={(e) => setInputTahun2(e.target.value)}
              className="w-full px-5 py-4 rounded-xl border border-slate-300 text-lg bg-white font-bold text-slate-800"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
        </div>
        <div className="w-full lg:w-auto">
          <button
            onClick={handleApplyFilter}
            className="w-full flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-8 rounded-xl shadow-md transition-all text-xl"
          >
            <Search size={24} />
            Terapkan Filter
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <CalendarIcon className="text-primary-600" size={28} />
            Komparasi{" "}
            {opsenType === "TOTAL"
              ? "Total Keseluruhan"
              : `Opsen ${opsenType}`}{" "}
            {tahun1} vs {tahun2}
          </h3>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 border-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all text-lg"
          >
            <Download size={22} />
            Download Laporan Excel
          </button>
        </div>

        <div className="h-[450px]">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold text-lg animate-pulse">
                Memuat Analisis Data...
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData || []}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 16, fontWeight: "bold" }}
                  tickLine={false}
                  axisLine={false}
                  dy={15}
                />
                <YAxis
                  width={110}
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
                  formatter={(value) =>
                    `Rp ${Number(value).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}`
                  }
                  contentStyle={{
                    borderRadius: "12px",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                  cursor={{ fill: "#f1f5f9" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "18px", paddingTop: "20px" }}
                />
                <Bar
                  dataKey={tahun2}
                  name={`Realisasi ${tahun2}`}
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
                <Bar
                  dataKey={tahun1}
                  name={`Realisasi ${tahun1}`}
                  fill="#e11d48"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Table Analytics View */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">
          Perbandingan Realisasi Opsen (Growth Percentage)
        </h3>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="w-full py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="text-slate-500 font-bold text-lg animate-pulse">
                Menghitung Rincian Pertumbuhan...
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="p-5 text-xl font-bold text-slate-700">
                    Periode
                  </th>
                  <th className="p-5 text-xl font-bold text-slate-700">
                    Realisasi {tahun2}
                  </th>
                  <th className="p-5 text-xl font-bold text-slate-700">
                    Realisasi {tahun1}
                  </th>
                  <th className="p-5 text-xl font-bold text-slate-700">
                    Pertumbuhan (%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(comparisonData || []).map((item, idx) => {
                  const monthsFullName = [
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
                  const itemMonthIndex = monthsFullName.indexOf(item.name);
                  const currentMonthIdx = new Date().getMonth();
                  const currentYear = new Date().getFullYear();

                  const isFutureMonth =
                    Number(tahun1) > currentYear ||
                    (Number(tahun1) === currentYear &&
                      itemMonthIndex > currentMonthIdx);
                  const isCurrentMonth =
                    Number(tahun1) === currentYear &&
                    itemMonthIndex === currentMonthIdx;

                  const growth =
                    item[tahun1] !== undefined &&
                    item[tahun1] !== null &&
                    item[tahun2]
                      ? (
                          ((item[tahun1] - item[tahun2]) / item[tahun2]) *
                          100
                        ).toFixed(1)
                      : null;
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-5 text-lg font-bold text-slate-800">
                        {item.name}
                      </td>
                      <td className="p-5 text-lg text-slate-600 drop-shadow-sm">
                        Rp{" "}
                        {Number(item[tahun2]).toLocaleString("id-ID", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 1,
                        })}
                      </td>
                      <td className="p-5 text-lg font-bold text-slate-800 drop-shadow-sm">
                        {isFutureMonth ? (
                          <span className="text-slate-400 italic font-normal">
                            Belum Berjalan
                          </span>
                        ) : (
                          <div className="flex flex-col">
                            <span>
                              {`Rp ${Number(item[tahun1] || 0).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}`}
                            </span>
                            {isCurrentMonth && (
                              <span className="text-xs text-orange-500 italic font-normal mt-0.5">
                                *Sedang berjalan
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-5">
                        {growth !== null ? (
                          <span
                            className={`inline-flex items-center px-4 py-2 rounded-lg text-lg font-bold ${
                              growth > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {growth > 0 ? "+" : ""}
                            {growth}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
