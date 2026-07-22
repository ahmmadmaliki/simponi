import { useQuery } from "@tanstack/react-query";
import { CheckSquare, DollarSign } from "lucide-react";
import { useState } from "react";
import api from "../api/axios";

export default function KinerjaKegiatan() {
  const [filterTahun, setFilterTahun] = useState(
    new Date().getFullYear().toString(),
  );

  const { data: kegiatanList, isLoading } = useQuery({
    queryKey: ["kinerjaData", filterTahun],
    queryFn: async () => {
      const res = await api.get("/kinerja", {
        params: {
          tahun: filterTahun,
        },
      });
      return res.data;
    },
  });

  const validData = kegiatanList || [];
  const totalTarget = validData.reduce((acc, curr) => acc + curr.target, 0);
  const totalRealisasi = validData.reduce(
    (acc, curr) => acc + curr.realisasi,
    0,
  );
  const persentaseTotal =
    totalTarget > 0 ? Math.round((totalRealisasi / totalTarget) * 100) : 0;

  const totalTargetAnggaran = validData.reduce(
    (acc, curr) => acc + (curr.targetAnggaran || 0),
    0,
  );
  const totalRealisasiAnggaran = validData.reduce(
    (acc, curr) => acc + (curr.realisasiAnggaran || 0),
    0,
  );
  const persentaseAnggaran =
    totalTargetAnggaran > 0
      ? Math.round((totalRealisasiAnggaran / totalTargetAnggaran) * 100)
      : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">
            Kinerja Kegiatan Operasional (Renja)
          </h2>
          <p className="text-slate-500 mt-1 text-xl">
            Periode Berjalan: Tahunan ({filterTahun})
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
            className="w-full sm:w-auto pl-4 pr-10 py-2.5 md:py-3 rounded-xl border border-slate-300 text-sm md:text-base bg-white shadow-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 font-semibold"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Kegiatan */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary-100 text-primary-600 p-3 rounded-xl">
              <CheckSquare size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              Ringkasan Kegiatan
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-slate-500 font-bold text-xs uppercase mb-1">
                Total Rencana
              </p>
              <p className="text-2xl font-black text-slate-800">
                {totalTarget}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-slate-500 font-bold text-xs uppercase mb-1">
                Terlaksana
              </p>
              <p className="text-2xl font-black text-slate-800">
                {totalRealisasi}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-slate-500 font-bold text-xs uppercase mb-1">
                Total Program
              </p>
              <p className="text-2xl font-black text-slate-800">
                {validData.length}
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-slate-500 font-bold text-xs uppercase mb-1">
                Persentase Terlaksana
              </p>
              <p className="text-2xl font-black text-primary-600">
                {persentaseTotal}%
              </p>
            </div>
          </div>
        </div>

        {/* Card Anggaran */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
              <DollarSign size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              Ringkasan Anggaran
            </h3>
          </div>
          <div className="space-y-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-slate-500 font-bold text-xs uppercase mb-1">
                  Total Anggaran
                </p>
                <p className="text-xl lg:text-2xl font-black text-slate-800">
                  Rp {totalTargetAnggaran.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="text-slate-500 font-bold text-xs uppercase mb-1">
                    Realisasi Dana
                  </p>
                  <p className="text-xl lg:text-2xl font-black text-emerald-600">
                    Rp {totalRealisasiAnggaran.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 font-bold text-xs uppercase mb-1">
                    Serapan
                  </p>
                  <p className="text-xl font-black text-emerald-600">
                    {persentaseAnggaran}%
                  </p>
                </div>
              </div>
              <div className="bg-slate-200 rounded-full h-3 w-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(persentaseAnggaran, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">
          Daftar Kegiatan Bulanan
        </h3>

        <div className="space-y-6">
          {isLoading ? (
            <p className="text-center font-bold text-xl text-slate-500 py-10">
              Memuat Data Kegiatan...
            </p>
          ) : (
            validData.map((kegiatan) => {
              const progress =
                kegiatan.target > 0
                  ? (kegiatan.realisasi / kegiatan.target) * 100
                  : 0;
              const budgetProgress =
                kegiatan.targetAnggaran > 0
                  ? (kegiatan.realisasiAnggaran / kegiatan.targetAnggaran) * 100
                  : 0;
              return (
                <div
                  key={kegiatan.id}
                  className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row justify-between mb-4 gap-4">
                    <div className="flex-1">
                      <span className="inline-block px-4 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-sm mb-3">
                        {kegiatan.jenis}
                      </span>
                      <h4 className="text-2xl font-bold text-slate-800">
                        {kegiatan.nama}
                      </h4>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-3xl font-black text-slate-800">
                        {kegiatan.realisasi}{" "}
                        <span className="text-xl text-slate-500 font-normal">
                          / {kegiatan.target}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-slate-500 mt-1 uppercase">
                        Kegiatan Selesai
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-100 rounded-full h-5 w-full mt-2 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full ${progress >= 100 ? "bg-green-500" : progress >= 50 ? "bg-primary-500" : "bg-yellow-500"}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 text-right">
                    <span
                      className={
                        progress >= 100
                          ? "text-green-600"
                          : progress >= 50
                            ? "text-primary-600"
                            : "text-yellow-600"
                      }
                    >
                      {progress.toFixed(0)}%
                    </span>
                  </div>

                  {/* Budget Section */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">
                        Target Anggaran
                      </p>
                      <p className="text-lg font-semibold text-slate-700">
                        Rp{" "}
                        {kegiatan.targetAnggaran?.toLocaleString("id-ID") || 0}
                      </p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">
                        Realisasi Anggaran
                      </p>
                      <div className="text-lg font-bold text-emerald-600 flex flex-wrap items-center gap-2 justify-start md:justify-end">
                        Rp{" "}
                        {kegiatan.realisasiAnggaran?.toLocaleString("id-ID") ||
                          0}
                        <span className="text-sm font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          {budgetProgress.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
