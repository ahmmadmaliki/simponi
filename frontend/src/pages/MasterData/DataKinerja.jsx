import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Upload, FileSpreadsheet, Search } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DataKinerja() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const { data: kinerja, isLoading } = useQuery({
    queryKey: ['dataMasterKinerja'],
    queryFn: async () => {
      const res = await api.get('/master/kinerja');
      return res.data;
    }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;
  
  const filteredData = kinerja?.filter(item => 
    item.jenisKegiatan?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.bulan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tahun?.toString().includes(searchTerm)
  ) || [];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/kinerja', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dataMasterKinerja']);
      alert('Data Kinerja Kegiatan berhasil diunggah!');
    },
    onError: () => {
      alert('Gagal mengunggah data. Pastikan format kolom: Jenis Kegiatan, Target Jumlah, Realisasi Jumlah, Tahun, Bulan.');
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadMutation.mutate(file);
      e.target.value = null; // reset input
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-100 text-primary-700 rounded-xl">
            <FileSpreadsheet size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Data Kinerja Kegiatan</h2>
            <p className="text-slate-500 mt-1">Kelola data target dan realisasi program kerja</p>
          </div>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            <Upload size={20} />
            {uploadMutation.isPending ? 'Mengunggah...' : 'Unggah Excel Kinerja'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-700">Riwayat Kinerja</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Cari Kegiatan / Tahun..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-64"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-sm">
                <th className="p-4 font-semibold border-b border-slate-200">Jenis Kegiatan</th>
                <th className="p-4 font-semibold border-b border-slate-200">Bulan</th>
                <th className="p-4 font-semibold border-b border-slate-200 text-center">Tahun</th>
                <th className="p-4 font-semibold border-b border-slate-200 text-right">Target Jumlah</th>
                <th className="p-4 font-semibold border-b border-slate-200 text-right">Realisasi Jumlah</th>
                <th className="p-4 font-semibold border-b border-slate-200 text-center">Capaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    <LoadingSpinner className="mx-auto w-8 h-8 text-primary-500" />
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">Belum ada data Kinerja Kegiatan yang diunggah.</td>
                </tr>
              ) : (
                currentItems.map((item, idx) => {
                  const capaian = item.targetJumlah > 0 
                    ? ((item.realisasiJumlah / item.targetJumlah) * 100).toFixed(1) 
                    : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-slate-800 font-medium">{item.jenisKegiatan}</td>
                      <td className="p-4 text-slate-600">{item.bulan}</td>
                      <td className="p-4 text-slate-600 text-center">{item.tahun}</td>
                      <td className="p-4 text-slate-800 text-right font-semibold">{item.targetJumlah}</td>
                      <td className="p-4 text-slate-800 text-right font-semibold">{item.realisasiJumlah}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          capaian >= 100 ? 'bg-emerald-100 text-emerald-700' :
                          capaian >= 80 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {capaian}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
            <span className="text-sm text-slate-500">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                Sebelumnnya
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
