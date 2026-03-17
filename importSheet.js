import axios from "axios";
import csv from "csv-parser";
import { Readable } from "stream";
// IMPORTANTE: Importamos la conexión unificada
import db from "./config/database.js"; 

function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

function cleanAmount(amountStr) {
  if (!amountStr || amountStr.trim() === '') return 0;
  let cleaned = amountStr.replace(/[$\s]/g, '');
  if (/\.\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (/,\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  return parseFloat(cleaned) || 0;
}

// URLs de Google Sheets (se mantienen igual)
const TRIPS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=11106421&single=true&output=csv";
const CANCUN_2024_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=1294828187&single=true&output=csv";
const MARDEL_ENERO_2025_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=0&single=true&output=csv";
const BRC_2025_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=83771080&single=true&output=csv";
const CARILO_2025_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=1589138416&single=true&output=csv";
const BUZIOS_2025_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=1539444841&single=true&output=csv";
const PANAMA_2026_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=323108715&single=true&output=csv";

async function importSheet() {
  console.log("🚀 Starting import process...");
  try {
    // 1. Usamos db.query (del archivo database.js unificado)
    await db.query('SET search_path TO public;');
    
    // 2. Limpieza y creación de TRIPS
    await db.query(`DROP TABLE IF EXISTS public.trips CASCADE;`);
    await db.query(`
      CREATE TABLE public.trips (
        id SERIAL PRIMARY KEY,
        destiny VARCHAR(255),
        month VARCHAR(50),
        year VARCHAR(50),
        dolarExchange DECIMAL(10,2) NOT NULL
      );
    `);

    const responseTrips = await axios.get(TRIPS_URL);
    const resultsTrips = [];

    await new Promise((resolve, reject) => {
      Readable.from(responseTrips.data)
        .pipe(csv())
        .on("data", (row) => resultsTrips.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    for (const row of resultsTrips) {
      await db.query(
        `INSERT INTO public.trips (id, destiny, month, year, dolarExchange) VALUES ($1, $2, $3, $4, $5)`,
        [row["ID"], row["LUGAR"], row["MES"], row["AÑO"], cleanAmount(row["CAMBIO DOLAR-PESO"])]
      );
    }
    console.log("✅ Trips imported");

    // 3. Limpieza y creación de EXPENSES
    await db.query(`DROP TABLE IF EXISTS public.expenses CASCADE;`);
    await db.query(`
      CREATE TABLE public.expenses (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        responsible VARCHAR(100),
        paymentMethod VARCHAR(50),
        travelDescription VARCHAR(255),
        travelId VARCHAR(50),
        exchange VARCHAR(50),
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Procesamiento de Sheets de gastos...
    const sheetConfigs = [
      { url: CANCUN_2024_URL, desc: "Cancún 2024", id: "2" },
      { url: MARDEL_ENERO_2025_URL, desc: "Mardel 2025", id: "3" },
      { url: BRC_2025_URL, desc: "BRC 2025", id: "4" },
      { url: CARILO_2025_URL, desc: "Cariló 2025", id: "5" },
      { url: BUZIOS_2025_URL, desc: "Buzios 2025", id: "6" },
      { url: PANAMA_2026_URL, desc: "Panama 2026", id: "7" }
    ];

    for (const config of sheetConfigs) {
      const resp = await axios.get(config.url);
      const rows = [];
      await new Promise((res, rej) => {
        Readable.from(resp.data).pipe(csv()).on("data", r => rows.push(r)).on("end", res).on("error", rej);
      });

      for (const row of rows) {
        if (row["Descripción"] && row["Descripción"] !== "TOTAL") {
          await db.query(
            `INSERT INTO public.expenses (type, amount, responsible, travelDescription, travelId, exchange, date)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              row["Descripción"], 
              cleanAmount(row["Monto"]), 
              row["Responsable"], 
              config.desc, 
              config.id, 
              row["Cambio"], 
              parseDate(row["Fecha"])
            ]
          );
        }
      }
      console.log(`✅ Imported: ${config.desc}`);
    }

    console.log("Import success 🚀");
  } catch (err) {
    console.error("❌ ERROR DURANTE LA IMPORTACIÓN:", err);
  }
}

export { importSheet };