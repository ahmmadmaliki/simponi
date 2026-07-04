import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Clock } from 'lucide-react';

const fetchUsers = async () => {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Gagal mengambil data users');
  return res.json();
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'staff',
    noWa: '',
    email: '',
    receiveNotif: true,
  });

  const { data: setting, isLoading: isSettingLoading } = useQuery({
    queryKey: ['notificationSetting'],
    queryFn: async () => {
      const res = await fetch('/api/settings/notification');
      if (!res.ok) throw new Error('Gagal memuat setting');
      return res.json();
    }
  });

  const [settingForm, setSettingForm] = useState({
    frequency: 'weekly',
    dayOfWeek: 6,
    dateOfMonth: 1,
    time: '08:00'
  });

  useEffect(() => {
    if (setting) {
      setSettingForm({
        frequency: setting.frequency,
        dayOfWeek: setting.dayOfWeek,
        dateOfMonth: setting.dateOfMonth,
        time: setting.time
      });
    }
  }, [setting]);

  const updateSettingMutation = useMutation({
    mutationFn: async (newSetting) => {
      const res = await fetch('/api/settings/notification', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSetting)
      });
      if (!res.ok) throw new Error('Gagal menyimpan setting');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notificationSetting']);
      alert('Jadwal Peringatan Berhasil Diperbarui!');
    },
    onError: (err) => alert(err.message)
  });

  const handleSaveSetting = (e) => {
    e.preventDefault();
    updateSettingMutation.mutate(settingForm);
  };

  const createMutation = useMutation({
    mutationFn: async (newData) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      });
      if (!res.ok) {
         const error = await res.json();
         throw new Error(error.message || 'Gagal menambah user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setIsModalOpen(false);
    },
    onError: (err) => alert(err.message)
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updateData }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (!res.ok) throw new Error('Gagal update user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setIsModalOpen(false);
    },
    onError: (err) => alert(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Gagal menghapus');
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(['users']),
    onError: (err) => alert(err.message)
  });

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        role: user.role,
        noWa: user.noWa || '',
        email: user.email || '',
        receiveNotif: user.receiveNotif ?? true,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        role: 'staff',
        noWa: '',
        email: '',
        receiveNotif: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id, username, role) => {
    if (role === 'admin' && username === 'admin') {
      alert('Anda tidak dapat menghapus akun Administrator utama.');
      return;
    }
    if (window.confirm(`Apakah Anda yakin ingin menghapus user ${username}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleNotif = (user) => {
    updateMutation.mutate({
      id: user.id,
      username: user.username,
      role: user.role,
      noWa: user.noWa,
      email: user.email,
      receiveNotif: !user.receiveNotif
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Manajemen User</h1>
          <p className="text-slate-500 mt-1">Kelola hak akses dan kontak notifikasi pengguna SIOPTIMA.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold transition-colors shadow-sm"
        >
          <Plus size={20} />
          Tambah User
        </button>
      </div>

      {/* Panel Pengaturan Jadwal */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-primary-600" />
          Pengaturan Jadwal Peringatan Otomatis
        </h2>
        {isSettingLoading ? (
          <p className="text-slate-500">Memuat pengaturan...</p>
        ) : (
          <form onSubmit={handleSaveSetting} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Frekuensi</label>
              <select 
                value={settingForm.frequency}
                onChange={e => setSettingForm({...settingForm, frequency: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
              >
                <option value="daily">Harian (Setiap Hari)</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
            </div>
            
            {settingForm.frequency === 'weekly' && (
              <div className="flex-1 w-full animate-in fade-in zoom-in-95">
                <label className="block text-sm font-medium text-slate-700 mb-1">Hari</label>
                <select 
                  value={settingForm.dayOfWeek}
                  onChange={e => setSettingForm({...settingForm, dayOfWeek: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                >
                  <option value={1}>Senin</option>
                  <option value={2}>Selasa</option>
                  <option value={3}>Rabu</option>
                  <option value={4}>Kamis</option>
                  <option value={5}>Jumat</option>
                  <option value={6}>Sabtu</option>
                  <option value={0}>Minggu</option>
                </select>
              </div>
            )}

            {settingForm.frequency === 'monthly' && (
              <div className="flex-1 w-full animate-in fade-in zoom-in-95">
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                <input 
                  type="number" 
                  min="1" max="31"
                  value={settingForm.dateOfMonth}
                  onChange={e => setSettingForm({...settingForm, dateOfMonth: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                />
              </div>
            )}

            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">Pukul</label>
              <input 
                type="time" 
                value={settingForm.time}
                onChange={e => setSettingForm({...settingForm, time: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={updateSettingMutation.isPending}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 w-full md:w-auto h-[42px]"
            >
              {updateSettingMutation.isPending ? 'Menyimpan...' : 'Simpan Jadwal'}
            </button>
          </form>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">WhatsApp</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-center">Notifikasi</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-400">Memuat data...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-slate-400">Tidak ada data pengguna</td></tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{user.username}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'kadin' ? 'bg-amber-100 text-amber-800' :
                        user.role === 'sekretaris' ? 'bg-primary-100 text-primary-800' :
                        'bg-emerald-100 text-emerald-800'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.noWa || '-'}</td>
                    <td className="px-6 py-4 text-slate-600">{user.email || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleToggleNotif(user)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${user.receiveNotif ? 'bg-primary-600' : 'bg-slate-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.receiveNotif ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => handleOpenModal(user)}
                          className="text-primary-600 hover:text-primary-800 hover:bg-primary-50 p-2 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id, user.username, user.role)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Hapus User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  placeholder="Budi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {editingUser ? '(Kosongkan jika tidak diubah)' : '*'}
                </label>
                <input 
                  type="password" 
                  required={!editingUser}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  placeholder="***"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role/Peran *</label>
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                >
                  <option value="admin">Admin (Akses Penuh)</option>
                  <option value="kadin">Kepala Dinas</option>
                  <option value="staff">Staff Biasa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp (Opsional)</label>
                <input 
                  type="text" 
                  value={formData.noWa}
                  onChange={e => setFormData({...formData, noWa: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  placeholder="08123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email (Opsional)</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  placeholder="kadin@magetan.go.id"
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, receiveNotif: !formData.receiveNotif})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.receiveNotif ? 'bg-primary-600' : 'bg-slate-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.receiveNotif ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-sm font-medium text-slate-700">Terima Peringatan WA & Email</span>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambah User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
