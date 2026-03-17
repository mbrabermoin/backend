import axios from "axios";
import csv from "csv-parser";
import pkg from "pg";
const { Pool } = pkg;
import { Readable } from "stream";

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

const isProduction = process.env.DATABASE_URL;

const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        user: process.env.PGUSER || "admin",
        host: process.env.PGHOST || "localhost",
        database: process.env.PGDATABASE || "appdb",
        password: process.env.PGPASSWORD || "admin",
        port: process.env.PGPORT || 5432,
      }
);

function cleanAmount(amountStr) {
  if (!amountStr || amountStr.trim() === '') return 0;
  
  let cleaned = amountStr.replace(/[$\s]/g, '');
  
 if (/\.\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/,/g, '');
  } 
  else if (/,\d{2}$/.test(cleaned)) {
     cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  
  return parseFloat(cleaned) || 0;
}

const TRIPS_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=11106421&single=true&output=csv";

const CANCUN_2024_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=1294828187&single=true&output=csv";

const MARDEL_ENERO_2025_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=0&single=true&output=csv";

const BRC_2025_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=83771080&single=true&output=csv";

  const CARILO_2025_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=1589138416&single=true&output=csv";

  const BUZIOS_2025_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=1539444841&single=true&output=csv";

  const PANAMA_2026_URL = 
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=323108715&single=true&output=csv"

async function importSheet() {
  console.log("Starting import process...");
  try {
    await pool.query(`DROP TABLE IF EXISTS trips;`);


    console.log("Import success 🚀");
  } catch (err) {
    console.error("ERROR:", err);
  }
}

export { importSheet };
