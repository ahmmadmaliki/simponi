import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, MapPin, Activity, AlertTriangle, ShieldAlert, Target } from 'lucide-react';

const fetchRekomendasi = async () => {
  const res = await fetch('/api/rekomendasi');
  if (!res.ok) throw new Error('Gagal mengambil data rekomendasi');
  return res.json();
};

export default function RekomendasiTindakan() {
  const { data: rekomendasi, isLoading, error } = useQuery({
    queryKey: ['rekomendasi'],
    queryFn: fetchRekomendasi
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Memuat data rekomendasi cerdas...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-8 -translate-y-8">
          <Lightbulb size={200} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl font-bold mb-4 flex items-center gap-3">
            <Target className="text-primary-200" size={32} />
            Rekomendasi Tindakan Proaktif
          </h1>
          <p className="text-primary-100 text-lg leading-relaxed">
            Sistem Pendukung Keputusan (DSS) SIOPTIMA menganalisis korelasi antara 
            <strong className="text-white mx-1">Data Masa Panen</strong> dan 
            <strong className="text-white mx-1">Tingkat Tunggakan Kendaraan</strong> 
            untuk menyarankan tindakan lapangan yang paling efektif di setiap kecamatan.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rekomendasi?.map((item) => {
          const isUtama = item.priorityLevel === 1;
          const isMenengah = item.priorityLevel === 2;
          
          let borderColor = 'border-l-blue-500';
          let iconBg = 'bg-blue-100 text-blue-600';
          let badgeBg = 'bg-blue-100 text-blue-800';
          let prioritasBadgeBg = 'bg-slate-100 text-slate-700';

          if (isUtama) {
            borderColor = 'border-l-red-500';
            iconBg = 'bg-red-100 text-red-600';
            badgeBg = 'bg-red-100 text-red-800';
            prioritasBadgeBg = 'bg-red-600 text-white shadow-sm';
          } else if (isMenengah) {
            borderColor = 'border-l-amber-500';
            iconBg = 'bg-amber-100 text-amber-600';
            badgeBg = 'bg-amber-100 text-amber-800';
            prioritasBadgeBg = 'bg-amber-500 text-white shadow-sm';
          }

          return (
            <div 
              key={item.id} 
              className={`bg-white rounded-2xl shadow-sm border p-6 transition-all duration-300 hover:shadow-md border-l-4 ${borderColor}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${iconBg}`}>
                    {isUtama ? <ShieldAlert size={24} /> : <Lightbulb size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{item.kecamatan}</h3>
                    <div className="flex gap-2 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeBg}`}>
                        {item.tipe}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${prioritasBadgeBg}`}>
                  {isUtama ? '🔥 ' : ''}{item.priorityText}
                </div>
              </div>

              <p className="text-slate-600 mb-6 leading-relaxed">
                {item.alasan}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <Activity className="text-emerald-500" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Status Panen</p>
                    <p className="text-sm font-bold text-slate-800">{item.dataPanen}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-amber-50 p-2 rounded-lg">
                    <AlertTriangle className="text-amber-500" size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Potensi Tunggakan</p>
                    <p className="text-sm font-bold text-slate-800">{item.dataTunggakan}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
