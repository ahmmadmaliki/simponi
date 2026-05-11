import React, { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';

export default function DataRealisasi() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const { data: realisasi, isLoading } = useQuery({
    queryKey: ['dataRealisasi'],
    queryFn: async () => {
      const res = await api.get('/realisasi');
      return res.data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/realisasi', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dataRealisasi']);
      alert('Data Realisasi Opsen berhasil diunggah!');
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
    window.location.href = `${api.defaults.baseURL}/template/realisasi`;
  };

  const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-700 rounded-xl">
            <FileSpreadsheet size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Data Realisasi Opsen</h2>
            <p className="text-slate-500 mt-1">Kelola data perolehan opsen pajak per kecamatan</p>
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
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
          >
            <Upload size={20} />
            {uploadMutation.isPending ? 'Mengunggah...' : 'Unggah Excel'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-sm">
                <th className="p-4">No</th>
                <th className="p-4">Kecamatan</th>
                <th className="p-4">Desa/Kelurahan</th>
                <th className="p-4">Periode</th>
                <th className="p-4">Total Opsen</th>
                <th className="p-4">PKB Pokok</th>
                <th className="p-4">Opsen PKB</th>
                <th className="p-4">BBNKB Pokok</th>
                <th className="p-4">Opsen BBNKB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr><td colSpan="9" className="p-8 text-center text-slate-500">Memuat data...</td></tr>
              ) : realisasi?.length === 0 ? (
                <tr><td colSpan="9" className="p-8 text-center text-slate-500">Belum ada data. Silakan unggah Excel.</td></tr>
              ) : (
                realisasi?.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500">{index + 1}</td>
                    <td className="p-4 font-bold text-slate-800">{item.kecamatan}</td>
                    <td className="p-4 text-slate-600">{item.desaKelurahan}</td>
                    <td className="p-4 text-slate-600">{item.bulan} {item.tahun}</td>
                    <td className="p-4 font-bold text-green-700">{formatRp(item.totalOpsen)}</td>
                    <td className="p-4 text-slate-500">{formatRp(item.pkbPokok)}</td>
                    <td className="p-4 text-slate-700 font-medium">{formatRp(item.opsenPkb)}</td>
                    <td className="p-4 text-slate-500">{formatRp(item.bbnkbPokok)}</td>
                    <td className="p-4 text-slate-700 font-medium">{formatRp(item.opsenBbnkb)}</td>
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
