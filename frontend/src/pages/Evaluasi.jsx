import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Download, Calendar as CalendarIcon } from 'lucide-react';

const MOCK_COMPARISON_DATA = [
  { name: 'Triwulan I', "2025": 4000, "2026": 4500 },
  { name: 'Triwulan II', "2025": 3000, "2026": 2800 },
  { name: 'Triwulan III', "2025": 2000, "2026": null },
  { name: 'Triwulan IV', "2025": 2780, "2026": null },
];

export default function Evaluasi() {
  const [opsenType, setOpsenType] = useState('PKB');
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-3xl font-extrabold text-slate-800">Evaluasi & Analisis Komparatif (YoY)</h2>
        <p className="text-slate-500 mt-2 text-xl">Bandingkan perolehan pendapatan tahun ini dengan tahun sebelumnya.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-primary-50 p-6 rounded-2xl shadow-inner border border-primary-100 flex flex-col lg:flex-row gap-6 items-end">
        <div className="flex-1 w-full relative">
           <label className="block text-lg font-bold text-primary-900 mb-2">Jenis Penerimaan Opsen</label>
           <select 
             value={opsenType} 
             onChange={(e) => setOpsenType(e.target.value)}
             className="w-full pl-5 pr-10 py-4 rounded-xl border border-slate-300 text-lg bg-white shadow-sm focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 font-bold text-slate-800"
           >
             <option value="PKB">Pajak Kendaraan Bermotor (PKB)</option>
             <option value="BBNKB">Bea Balik Nama Kendaraan Bermotor (BBNKB)</option>
             <option value="TOTAL">Total Keseluruhan</option>
           </select>
        </div>
        <div className="flex-1 w-full">
           <label className="block text-lg font-bold text-primary-900 mb-2">Tahun Perbandingan</label>
           <div className="flex items-center gap-3">
             <select className="w-full px-5 py-4 rounded-xl border border-slate-300 text-lg bg-white font-bold text-slate-800">
               <option>2026</option>
             </select>
             <span className="text-primary-800 font-bold px-2">VS</span>
             <select className="w-full px-5 py-4 rounded-xl border border-slate-300 text-lg bg-white font-bold text-slate-800">
               <option>2025</option>
             </select>
           </div>
        </div>
        <div className="w-full lg:w-auto">
          <button className="w-full flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-8 rounded-xl shadow-md transition-all text-xl">
            <Search size={24} />
            Terapkan Filter
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-8">
           <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <CalendarIcon className="text-primary-600" size={28}/>
              Komparasi {opsenType} (Dalam Juta Rupiah)
           </h3>
           <button className="flex items-center gap-2 border-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all text-lg">
             <Download size={22} />
             Download Laporan Excel
           </button>
        </div>
        
        <div className="h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_COMPARISON_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{fontSize: 18, fontWeight: 'bold'}} tickLine={false} axisLine={false} dy={15} />
              <YAxis tick={{fontSize: 16}} tickLine={false} axisLine={false} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', fontSize: '18px', fontWeight: 'bold' }}
                cursor={{fill: '#f1f5f9'}}
              />
              <Legend wrapperStyle={{fontSize: '18px', paddingTop: '20px'}} />
              <Bar dataKey="2025" name="Realisasi 2025" fill="#94a3b8" radius={[6, 6, 0, 0]} maxBarSize={80} />
              <Bar dataKey="2026" name="Realisasi 2026" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={80} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Table Analytics View */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
         <h3 className="text-2xl font-bold text-slate-800 mb-6">Detail Pertumbuhan (Growth Percentage)</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="p-5 text-xl font-bold text-slate-700">Periode</th>
                  <th className="p-5 text-xl font-bold text-slate-700">Realisasi 2025</th>
                  <th className="p-5 text-xl font-bold text-slate-700">Realisasi 2026</th>
                  <th className="p-5 text-xl font-bold text-slate-700">Pertumbuhan (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_COMPARISON_DATA.map((item, idx) => {
                  const growth = item["2026"] ? (((item["2026"] - item["2025"]) / item["2025"]) * 100).toFixed(1) : null;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-5 text-xl font-bold text-slate-800">{item.name}</td>
                      <td className="p-5 text-xl text-slate-600 drop-shadow-sm">Rp {item["2025"].toLocaleString('id-ID')} Jt</td>
                      <td className="p-5 text-xl font-bold text-slate-800">
                        {item["2026"] ? `Rp ${item["2026"].toLocaleString('id-ID')} Jt` : <span className="text-slate-400 italic font-normal">Belum Berjalan</span>}
                      </td>
                      <td className="p-5">
                        {growth !== null ? (
                          <span className={`inline-flex items-center px-4 py-2 rounded-lg text-lg font-bold ${
                            growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {growth > 0 ? '+' : ''}{growth}%
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
