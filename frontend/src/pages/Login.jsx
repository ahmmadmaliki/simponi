import { useMutation } from "@tanstack/react-query";
import { LogIn } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import logoProvinsi from "../assets/Logo Provinsi.png";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo");

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("auth", "true");
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      navigate(from, { replace: true });
    },
  });

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <img
          src={logoProvinsi}
          alt="Logo Provinsi"
          className="h-28 w-auto mb-5 drop-shadow-lg"
        />
        <h1 className="text-xl font-bold text-slate-500 uppercase tracking-widest text-center mb-1">
          UPT PPD Magetan
        </h1>
        <h2 className="text-center text-5xl font-black text-primary-900 tracking-tight drop-shadow-sm">
          SIOPTIMA
        </h2>
        <p className="mt-2 text-center text-lg text-primary-700 font-medium">
          Sistem Informasi Opsen Pajak Terintegrasi
          <br />
          dan Monitoring Analisis
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-8" onSubmit={handleLogin}>
            <div>
              <label
                htmlFor="username"
                className="block text-lg font-bold text-slate-700 mb-2"
              >
                Username Akun
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none block w-full px-5 py-4 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 text-lg sm:text-lg"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-lg font-bold text-slate-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-5 py-4 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 text-lg sm:text-lg"
              />
            </div>

            <div className="bg-primary-50 border border-primary-200 p-4 rounded-xl text-primary-800 text-[15px]">
              <strong>Demo Hint:</strong> Gunakan username <code>admin</code>{" "}
              atau <code>kadin</code> untuk melihat beranda.
            </div>

            <div>
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full flex justify-center items-center gap-3 py-4 px-4 border border-transparent rounded-xl shadow-md text-xl font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <LogIn size={26} />
                {loginMutation.isPending ? "Memeriksa..." : "Masuk Sistem"}
              </button>
            </div>

            {loginMutation.isError && (
              <div className="text-red-600 font-semibold text-center mt-4 p-3 bg-red-50 rounded-xl">
                Error:{" "}
                {loginMutation.error.response?.data?.message ||
                  "Gagal tersambung ke server"}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
