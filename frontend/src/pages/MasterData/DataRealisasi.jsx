import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Upload, Download, FileSpreadsheet, Search } from 'lucide-react';

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

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');
  const itemsPerPage = 10;
  
  const uniqueBulan = [...new Set(realisasi?.map(item => item.bulan) || [])].filter(Boolean);
  const uniqueTahun = [...new Set(realisasi?.map(item => item.tahun) || [])].filter(Boolean);

  const filteredData = realisasi?.filter(item => {
    const matchSearch = item.kecamatan?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.desaKelurahan?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchBulan = filterBulan === '' || item.bulan === filterBulan;
    const matchTahun = filterTahun === '' || item.tahun?.toString() === filterTahun;
    return matchSearch && matchBulan && matchTahun;
  }) || [];

  const totals = filteredData.reduce((acc, curr) => ({
    totalOpsen: acc.totalOpsen + (curr.totalOpsen || 0),
    pkbPokok: acc.pkbPokok + (curr.pkbPokok || 0),
    opsenPkb: acc.opsenPkb + (curr.opsenPkb || 0),
    bbnkbPokok: acc.bbnkbPokok + (curr.bbnkbPokok || 0),
    opsenBbnkb: acc.opsenBbnkb + (curr.opsenBbnkb || 0),
  }), { totalOpsen: 0, pkbPokok: 0, opsenPkb: 0, bbnkbPokok: 0, opsenBbnkb: 0 });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

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
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:max-w-2xl">
            <div className="relative w-full sm:w-1/2 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Cari kecamatan atau desa..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
            <select 
              value={filterBulan}
              onChange={(e) => { setFilterBulan(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-1/4 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Semua Bulan</option>
              {uniqueBulan.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select 
              value={filterTahun}
              onChange={(e) => { setFilterTahun(e.target.value); setCurrentPage(1); }}
              className="w-full sm:w-1/4 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Semua Tahun</option>
              {uniqueTahun.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
            Total Data: {filteredData.length}
          </div>
        </div>

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
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="9" className="p-8 text-center text-slate-500">Data tidak ditemukan.</td></tr>
              ) : (
                currentItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500">{indexOfFirstItem + index + 1}</td>
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
            {filteredData.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan="4" className="p-4 text-right font-extrabold text-slate-700">TOTAL KESELURUHAN:</td>
                  <td className="p-4 font-extrabold text-green-700">{formatRp(totals.totalOpsen)}</td>
                  <td className="p-4 font-bold text-slate-700">{formatRp(totals.pkbPokok)}</td>
                  <td className="p-4 font-bold text-slate-800">{formatRp(totals.opsenPkb)}</td>
                  <td className="p-4 font-bold text-slate-700">{formatRp(totals.bbnkbPokok)}</td>
                  <td className="p-4 font-bold text-slate-800">{formatRp(totals.opsenBbnkb)}</td>
                </tr>
              </tfoot>
            )}
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
