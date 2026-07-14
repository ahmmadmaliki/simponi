import { CheckSquare, Calendar, Users, Percent } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useState } from 'react';

export default function KinerjaKegiatan() {
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());
  const [filterBulanMulai, setFilterBulanMulai] = useState("Januari");
  const [filterBulanAkhir, setFilterBulanAkhir] = useState("Desember");

  const monthsList = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  const { data: kegiatanList, isLoading } = useQuery({
    queryKey: ['kinerjaData', filterTahun, filterBulanMulai, filterBulanAkhir],
    queryFn: async () => {
      const res = await api.get('/kinerja', {
        params: {
          tahun: filterTahun,
          bulanMulai: filterBulanMulai,
          bulanAkhir: filterBulanAkhir,
        }
      });
      return res.data;
    }
  });

  const validData = kegiatanList || [];
  const totalTarget = validData.reduce((acc, curr) => acc + curr.target, 0);
  const totalRealisasi = validData.reduce((acc, curr) => acc + curr.realisasi, 0);
  const persentaseTotal = totalTarget > 0 ? Math.round((totalRealisasi / totalTarget) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">Kinerja Kegiatan Operasional</h2>
          <p className="text-slate-500 mt-1 text-xl">
            Periode Berjalan: {filterBulanMulai} - {filterBulanAkhir} ({filterTahun})
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-4">
          <div className="bg-primary-100 text-primary-600 p-4 rounded-full">
            <CheckSquare size={36} />
          </div>
          <div>
            <p className="text-slate-500 font-bold text-lg uppercase">Total Rencana</p>
            <h3 className="text-4xl font-black text-slate-800">{totalTarget}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full">
            <Calendar size={36} />
          </div>
          <div>
            <p className="text-slate-500 font-bold text-lg uppercase">Terlaksana</p>
            <h3 className="text-4xl font-black text-slate-800">{totalRealisasi}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="bg-green-100 text-green-600 p-4 rounded-full">
            <Percent size={36} />
          </div>
          <div>
            <p className="text-slate-500 font-bold text-lg uppercase">Persentase</p>
            <h3 className="text-4xl font-black text-slate-800">{persentaseTotal}%</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="bg-orange-100 text-orange-600 p-4 rounded-full">
            <Users size={36} />
          </div>
          <div>
            <p className="text-slate-500 font-bold text-lg uppercase">Total Kegiatan</p>
            <h3 className="text-4xl font-black text-slate-800">{validData.length}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-2xl font-bold text-slate-800 mb-6">Daftar Kegiatan Bulanan</h3>

        <div className="space-y-6">
          {isLoading ? (
            <p className="text-center font-bold text-xl text-slate-500 py-10">Memuat Data Kegiatan...</p>
          ) : validData.map((kegiatan) => {
            const progress = kegiatan.target > 0 ? (kegiatan.realisasi / kegiatan.target) * 100 : 0;
            return (
              <div key={kegiatan.id} className="border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row justify-between mb-4 gap-4">
                  <div className="flex-1">
                    <span className="inline-block px-4 py-1 bg-slate-100 text-slate-700 rounded-full font-bold text-sm mb-3">
                      {kegiatan.jenis}
                    </span>
                    <h4 className="text-2xl font-bold text-slate-800">{kegiatan.nama}</h4>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-black text-slate-800">{kegiatan.realisasi} <span className="text-xl text-slate-500 font-normal">/ {kegiatan.target}</span></div>
                    <p className="text-lg font-bold text-slate-500 mt-1 uppercase">Kegiatan Selesai</p>
                  </div>
                </div>

                <div className="bg-slate-100 rounded-full h-5 w-full mt-2 overflow-hidden shadow-inner">
                  <div 
                    className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-primary-500' : 'bg-yellow-500'}`} 
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-right">
                  <span className={progress >= 100 ? 'text-green-600' : progress >= 50 ? 'text-primary-600' : 'text-yellow-600'}>
                    {progress.toFixed(0)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
