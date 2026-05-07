import { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../api/axios';

export default function UploadData() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error

  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = function(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/upload/opsen', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    onSuccess: (data) => {
       setStatus('success');
       setFile(null);
       setTimeout(() => setStatus('idle'), 6000);
       // Alerting success is nice, but rendering is better.
       // We'll log data preview to console for now.
       console.log('Processed Rows:', data.rowCount, 'Preview:', data.preview);
    },
    onError: (err) => {
       setStatus('error');
       setTimeout(() => setStatus('idle'), 6000);
       console.error(err);
    }
  });

  const handleUpload = () => {
    if (!file) return;
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', file);
    
    uploadMutation.mutate(formData);
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-3xl font-extrabold text-slate-800">Pembaruan Data (Excel)</h2>
        <p className="text-slate-500 mt-2 text-xl">Unggah file laporan Realisasi Penerimaan Opsen atau Kinerja Kegiatan dalam format .xlsx</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {status === 'success' && (
          <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-4 animate-in slide-in-from-top-4">
            <CheckCircle2 className="text-green-600 mt-1" size={32} />
            <div>
              <h3 className="text-2xl font-bold text-green-800">Berhasil Diunggah!</h3>
              <p className="text-lg text-green-700 mt-1">
                Data dari file Excel telah berhasil dikirim dan diproses di server. 
                <span className="block text-sm opacity-80 mt-1">Tip: Cek Console Browser (F12) untuk melihat hasil konversi data JSON sementara!</span>
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-4 animate-in slide-in-from-top-4">
            <XCircle className="text-red-500 mt-1" size={32} />
            <div>
              <h3 className="text-2xl font-bold text-red-800">Gagal Mengunggah</h3>
              <p className="text-lg text-red-700 mt-1">
                 {uploadMutation.error?.response?.data?.message || 'Server gagal memproses file ini. Pastikan koneksi dan format valid.'}
              </p>
            </div>
          </div>
        )}

        <form onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()} className="space-y-8">
          <div 
            className={`flex flex-col items-center justify-center border-4 border-dashed rounded-3xl p-16 transition-colors ${
              dragActive ? 'border-primary-500 bg-primary-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input 
               type="file" 
               id="fileInput" 
               multiple={false} 
               accept=".xlsx, .xls"
               onChange={handleChange} 
               className="hidden" 
            />
            
            {file ? (
              <div className="flex flex-col items-center text-center">
                <FileSpreadsheet className="text-green-600 mb-6" size={80} />
                <h4 className="text-2xl font-bold text-slate-800">{file.name}</h4>
                <p className="text-lg text-slate-500 mt-2 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button 
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-red-500 font-bold hover:text-red-700 text-lg transition-colors underline"
                >
                  Batal / Ganti File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <UploadCloud className="text-primary-400 mb-6" size={80} />
                <h4 className="text-2xl font-bold text-slate-700 mb-2">Tarik & Lepas File Excel Disini</h4>
                <p className="text-xl text-slate-500 mb-8">atau</p>
                <label 
                  htmlFor="fileInput"
                  className="cursor-pointer bg-white border-2 border-primary-600 text-primary-700 hover:bg-primary-50 hover:text-primary-800 font-bold py-4 px-10 rounded-xl shadow-sm text-xl transition-colors"
                >
                  Pilih File dari Komputer
                </label>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border-l-8 border-blue-500 p-6 rounded-r-xl">
             <h4 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <AlertCircle size={24} /> Petunjuk Unggah Data
             </h4>
             <ul className="list-disc list-inside mt-3 text-lg text-blue-800 space-y-2">
               <li>Format file harus berakhiran <strong>.xlsx</strong>.</li>
               <li>Pastikan format kolom sesuai dengan template resmi dinas.</li>
               <li>Data yang diunggah akan otomatis menambahkan/memperbarui data berdasarkan periode yang tercatat di dalam file.</li>
             </ul>
          </div>

          <div className="border-t border-slate-200 pt-8 mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || status === 'uploading'}
              className="flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-700 text-white font-bold py-5 px-12 rounded-xl shadow-lg transition-all text-2xl w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UploadCloud size={28} />
              {status === 'uploading' ? 'Memproses...' : 'Unggah Data Sekarang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
