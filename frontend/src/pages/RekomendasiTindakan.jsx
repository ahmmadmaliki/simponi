import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Calendar,
  Lightbulb,
  ShieldAlert,
  Store,
  Target,
} from "lucide-react";
import React, { useState } from "react";
import api from "../api/axios";

const fetchRekomendasi = async (bulan) => {
  const params = bulan !== null && bulan !== "" ? `?bulan=${bulan}` : "";
  const res = await api.get(`/rekomendasi${params}`);
  return res.data;
};

export default function RekomendasiTindakan() {
  const currentMonthIdx = new Date().getMonth().toString();
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx);

  const {
    data: rekomendasi,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["rekomendasi", selectedMonth],
    queryFn: () => fetchRekomendasi(selectedMonth),
  });

  const { data: pasaranData } = useQuery({
    queryKey: ["dataPasaran"],
    queryFn: async () => {
      const res = await api.get("/master/pasaran");
      return res.data;
    },
  });

  const displayData = React.useMemo(() => {
    if (!rekomendasi) return [];

    const utama = rekomendasi.filter((r) => r.priorityLevel === 1).slice(0, 4);
    const menengah = rekomendasi
      .filter((r) => r.priorityLevel === 2)
      .slice(0, 2);
    const rendah = rekomendasi.filter((r) => r.priorityLevel === 3).slice(0, 2);

    return [...utama, ...menengah, ...rendah];
  }, [rekomendasi]);

  if (isLoading)
    return (
      <div className="p-8 text-center text-slate-500">
        Memuat data rekomendasi cerdas...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-red-500">Error: {error.message}</div>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-8 -translate-y-8">
          <Lightbulb size={200} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-bold text-amber-400 mb-4 flex items-center gap-3">
            <Target className="text-primary-200" size={32} />
            Rekomendasi Tindakan Proaktif
          </h1>
          <p className="text-primary-100 text-lg leading-relaxed">
            Sistem Pendukung Keputusan (DSS) SIOPTIMA menganalisis korelasi
            antara
            <strong className="text-white mx-1">Data Masa Panen</strong> dan
            <strong className="text-white mx-1">
              Tingkat Tunggakan Kendaraan
            </strong>
            untuk menyarankan tindakan lapangan yang paling efektif di setiap
            kecamatan.
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        <div className="bg-primary-50 p-3 rounded-xl">
          <Calendar className="text-primary-600" size={24} />
        </div>
        <div className="flex-1 max-w-sm">
          <label className="block text-sm font-bold text-slate-700 mb-1">
            Simulasi Rekomendasi Bulan
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-lg bg-slate-50 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 font-bold text-slate-800 transition-all"
          >
            <option value="0">Januari</option>
            <option value="1">Februari</option>
            <option value="2">Maret</option>
            <option value="3">April</option>
            <option value="4">Mei</option>
            <option value="5">Juni</option>
            <option value="6">Juli</option>
            <option value="7">Agustus</option>
            <option value="8">September</option>
            <option value="9">Oktober</option>
            <option value="10">November</option>
            <option value="11">Desember</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayData.map((item) => {
          const isUtama = item.priorityLevel === 1;
          const isMenengah = item.priorityLevel === 2;

          let borderColor = "border-l-blue-500";
          let iconBg = "bg-blue-100 text-blue-600";
          let badgeBg = "bg-blue-100 text-blue-800";
          let prioritasBadgeBg = "bg-blue-300 text-blue-700";

          if (isUtama) {
            borderColor = "border-l-red-500";
            iconBg = "bg-red-100 text-red-600";
            badgeBg = "bg-red-100 text-red-800";
            prioritasBadgeBg = "bg-red-600 text-white shadow-sm";
          } else if (isMenengah) {
            borderColor = "border-l-amber-500";
            iconBg = "bg-amber-100 text-amber-600";
            badgeBg = "bg-amber-100 text-amber-800";
            prioritasBadgeBg = "bg-amber-500 text-white shadow-sm";
          }

          const matchedPasaran = pasaranData?.find((p) =>
            p.namaPasar.toLowerCase().includes(item.kecamatan.toLowerCase()),
          );

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl shadow-sm border p-6 transition-all duration-300 hover:shadow-md border-l-4 ${borderColor}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${iconBg}`}>
                    {isUtama ? (
                      <ShieldAlert size={24} />
                    ) : (
                      <Lightbulb size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      {item.kecamatan}
                    </h3>
                    <div className="flex gap-2 mt-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeBg}`}
                      >
                        {item.tipe}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold ${prioritasBadgeBg}`}
                >
                  {isUtama ? "🔥 " : ""}
                  {item.priorityText}
                </div>
              </div>

              <p className="text-slate-600 mb-6 leading-relaxed">
                {item.alasan}
                {item.alasan.includes("Tebu") && (
                  <span className="block mt-4 text-slate-500 text-sm italic">
                    <span className="font-bold">Catatan:</span>
                    <br />
                    Panen Tebu tidak terlalu berdampak pada penghasilan warga
                    lokal karena mayoritas panen dilakukan oleh pihak swasta
                    dari luar daerah yang menyewa lahan lokal.
                  </span>
                )}
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <Activity className="text-emerald-500" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">
                      Status Panen
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {item.dataPanen}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 p-2 rounded-lg">
                    <AlertTriangle className="text-amber-500" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">
                      Potensi Tunggakan
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {item.dataTunggakan}
                    </p>
                  </div>
                </div>
                {matchedPasaran && (
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <Store className="text-blue-500" size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">
                        Jadwal Pasaran
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {matchedPasaran.hariPasaran}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
