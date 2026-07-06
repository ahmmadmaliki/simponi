import React, { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Upload, Download, Target } from 'lucide-react';

export default function DataTarget() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const { data: targets, isLoading } = useQuery({
    queryKey: ['dataTarget'],
    queryFn: async () => {
      const res = await api.get('/target');
      return res.data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/target', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dataTarget']);
      alert('Data Target berhasil diunggah!');
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
    window.location.href = `${api.defaults.baseURL}/template/target`;
  };

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-100 text-primary-700 rounded-xl">
            <Target size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Data Target Opsen</h2>
            <p className="text-slate-500 mt-1">Kelola target penerimaan PKB dan BBNKB</p>
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
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
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
                <th className="p-4">Jenis Opsen</th>
                <th className="p-4">Tahun</th>
                <th className="p-4">Target Rupiah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : targets?.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500">Belum ada data. Silakan unggah Excel.</td></tr>
              ) : (
                targets?.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500">{index + 1}</td>
                    <td className="p-4 font-bold text-slate-800">{item.jenisOpsen}</td>
                    <td className="p-4 text-slate-600">{item.tahun}</td>
                    <td className="p-4 font-medium text-slate-700">{formatRp(item.targetRupiah)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
