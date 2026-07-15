import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

let BAPENDA_TOKEN = null;
let TOKEN_EXPIRES_AT = 0;

export const getBapendaToken = async () => {
  if (BAPENDA_TOKEN && Date.now() < TOKEN_EXPIRES_AT) {
    return BAPENDA_TOKEN;
  }

  try {
    const response = await axios.post(
      "https://simonas.dipendajatim.go.id/rest/oauth/token",
      {
        grant_type: "client_credentials",
        client_id: process.env.BAPENDA_CLIENT_ID,
        client_secret: process.env.BAPENDA_CLIENT_SECRET,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    BAPENDA_TOKEN = response.data.access_token;
    TOKEN_EXPIRES_AT =
      Date.now() + (response.data.expires_in || 3600) * 1000 - 60000; // buffer 1 minute
    return BAPENDA_TOKEN;
  } catch (error) {
    console.error(
      "Failed to get Bapenda Token:",
      error.response?.data || error.message,
    );
    throw new Error("Gagal mendapatkan token Bapenda Jatim");
  }
};

export const decodeBapendaResponse = (responseData) => {
  if (!responseData) return [];
  if (typeof responseData.data === "string") {
    try {
      const decodedStr = Buffer.from(responseData.data, "base64").toString(
        "utf-8",
      );
      return JSON.parse(decodedStr);
    } catch (e) {
      console.error("Error decoding base64:", e);
      return [];
    }
  }
  if (Array.isArray(responseData.data)) return responseData.data;
  if (Array.isArray(responseData)) return responseData;
  return [];
};

export const generateHybridQueries = (startDateStr, endDateStr) => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const queries = { months: null, dailyChunks: [] };
  if (start > end) return queries;

  let firstFullMonthStart = new Date(start.getFullYear(), start.getMonth(), 1);
  if (start.getDate() > 1) {
    firstFullMonthStart = new Date(
      start.getFullYear(),
      start.getMonth() + 1,
      1,
    );
  }

  let lastFullMonthEnd = new Date(end.getFullYear(), end.getMonth() + 1, 0);
  if (end.getDate() < lastFullMonthEnd.getDate()) {
    lastFullMonthEnd = new Date(end.getFullYear(), end.getMonth(), 0);
  }

  const chunkDays = (s, e) => {
    let current = new Date(s);
    const chunks = [];
    while (current <= e) {
      let chunkEnd = new Date(current);
      chunkEnd.setDate(current.getDate() + 6);
      if (chunkEnd > e) chunkEnd = new Date(e);
      const fmt = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dt = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${dt}`;
      };
      chunks.push({ tgbayar_awal: fmt(current), tgbayar_akhir: fmt(chunkEnd) });
      current = new Date(chunkEnd);
      current.setDate(current.getDate() + 1);
    }
    return chunks;
  };

  if (firstFullMonthStart <= lastFullMonthEnd) {
    const fmtMonth = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    queries.months = {
      blbayar_awal: fmtMonth(firstFullMonthStart),
      blbayar_akhir: fmtMonth(lastFullMonthEnd),
    };
    const prefixEnd = new Date(firstFullMonthStart);
    prefixEnd.setDate(prefixEnd.getDate() - 1);
    if (start <= prefixEnd)
      queries.dailyChunks.push(...chunkDays(start, prefixEnd));
    const suffixStart = new Date(lastFullMonthEnd);
    suffixStart.setDate(suffixStart.getDate() + 1);
    if (suffixStart <= end)
      queries.dailyChunks.push(...chunkDays(suffixStart, end));
  } else {
    queries.dailyChunks.push(...chunkDays(start, end));
  }
  return queries;
};

export const fetchMetricsForDateRange = async (
  tglMulai,
  tglAkhir,
  kodeKota,
  token,
) => {
  const hybridQueries = generateHybridQueries(tglMulai, tglAkhir);
  let realisasiPkb = 0;
  let realisasiBbnkb = 0;
  const promises = [];

  if (hybridQueries.months) {
    promises.push(
      axios
        .get("https://simonas.dipendajatim.go.id/rest/api/v2026/opsen/total", {
          params: { ...hybridQueries.months, kode_kota: kodeKota },
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const data = decodeBapendaResponse(res.data);
          data.forEach((item) => {
            realisasiPkb += Number(item.total_opsen_pkb_tgbayar) || 0;
            realisasiBbnkb += Number(item.total_opsen_bbn_tgbayar) || 0;
          });
        })
        .catch((err) => {
          if (err.response && err.response.status === 404) {
            console.log(`[Bapenda] Data tidak ditemukan (404) untuk bulan:`, hybridQueries.months);
          } else {
            throw err;
          }
        }),
    );
  }

  for (const chunk of hybridQueries.dailyChunks) {
    promises.push(
      axios
        .get("https://simonas.dipendajatim.go.id/rest/api/v2026/opsen/pkb", {
          params: { ...chunk, kode_kota: kodeKota },
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const data = decodeBapendaResponse(res.data);
          data.forEach((item) => {
            realisasiPkb += Number(item.opsen_pkb) || 0;
          });
        })
        .catch((err) => {
          if (err.response && err.response.status === 404) {
            console.log(`[Bapenda] Data PKB tidak ditemukan (404) untuk tanggal:`, chunk);
          } else {
            throw err;
          }
        }),
    );
    promises.push(
      axios
        .get("https://simonas.dipendajatim.go.id/rest/api/v2026/opsen/bbn", {
          params: { ...chunk, kode_kota: kodeKota },
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          const data = decodeBapendaResponse(res.data);
          data.forEach((item) => {
            realisasiBbnkb += Number(item.opsen_bbn) || 0;
          });
        })
        .catch((err) => {
          if (err.response && err.response.status === 404) {
            console.log(`[Bapenda] Data BBNKB tidak ditemukan (404) untuk tanggal:`, chunk);
          } else {
            throw err;
          }
        }),
    );
  }

  await Promise.all(promises);
  return { realisasiPkb, realisasiBbnkb };
};
