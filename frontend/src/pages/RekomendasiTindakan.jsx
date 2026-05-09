import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, MapPin, Activity, AlertTriangle, ShieldAlert, Target } from 'lucide-react';

const fetchRekomendasi = async () => {
  const res = await fetch('http://localhost:5000/api/rekomendasi');
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
            Sistem Pendukung Keputusan (DSS) SIMPONI menganalisis korelasi antara 
            <strong className="text-white mx-1">Data Masa Panen</strong> dan 
            <strong className="text-white mx-1">Tingkat Tunggakan Kendaraan</strong> 
            untuk menyarankan tindakan lapangan yang paling efektif di setiap kecamatan.
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {rekomendasi?.map((item) => {
          const isOperasi = item.tipe === 'Operasi Gabungan';
          
          return (
            <div 
              key={item.id} 
              className={`bg-white rounded-2xl shadow-sm border p-6 transition-all duration-300 hover:shadow-md ${
                isOperasi ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isOperasi ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {isOperasi ? <ShieldAlert size={24} /> : <Lightbulb size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{item.kecamatan}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      isOperasi ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.tipe}
                    </span>
                  </div>
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
                    <p className="text-xs text-slate-500 font-medium">Rasio Tunggakan</p>
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
