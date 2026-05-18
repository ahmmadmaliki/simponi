import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Upload, Download, FileWarning } from 'lucide-react';

export default function DataTunggakan() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const { data: tunggakan, isLoading } = useQuery({
    queryKey: ['dataTunggakan'],
    queryFn: async () => {
      const res = await api.get('/tunggakan');
      return res.data;
    }
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = tunggakan?.slice(indexOfFirstItem, indexOfLastItem) || [];
  const totalPages = Math.ceil((tunggakan?.length || 0) / itemsPerPage);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/tunggakan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dataTunggakan']);
      alert('Data Tunggakan berhasil diunggah!');
    },
    onError: () => {
      alert('Gagal mengunggah data. Pastikan format sesuai template.');
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadMutation.mutate(file);
      e.target.value = null;
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = `${api.defaults.baseURL}/template/tunggakan`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-700 rounded-xl">
            <FileWarning size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Data Tunggakan</h2>
            <p className="text-slate-500 mt-1">Kelola data rasio tunggakan pajak kendaraan bermotor</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
          >
            <Download size={20} />
            Unduh Template
          </button>
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
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            <Upload size={20} />
            {uploadMutation.isPending ? 'Mengunggah...' : 'Unggah Excel'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="p-4">No</th>
                <th className="p-4">Kecamatan</th>
                <th className="p-4">Desa</th>
                <th className="p-4">Bulan</th>
                <th className="p-4">Tahun</th>
                <th className="p-4">Rasio Tunggakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : tunggakan?.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Belum ada data. Silakan unggah Excel.</td></tr>
              ) : (
                currentItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500">{indexOfFirstItem + index + 1}</td>
                    <td className="p-4 font-medium text-slate-800">{item.kecamatan}</td>
                    <td className="p-4 text-slate-600">{item.desa || '-'}</td>
                    <td className="p-4 text-slate-600">{item.bulan}</td>
                    <td className="p-4 text-slate-600">{item.tahun}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-700">{item.rasioTunggakan}%</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm bg-slate-50">
          <span className="text-slate-500 font-medium">
            Halaman {currentPage} dari {totalPages || 1}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-slate-600 font-medium disabled:opacity-50 hover:bg-slate-100 transition-colors"
            >
              Sebelumnya
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalPages === 0}
              className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-slate-600 font-medium disabled:opacity-50 hover:bg-slate-100 transition-colors"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
