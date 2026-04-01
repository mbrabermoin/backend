const axios = require("axios");
const csv = require("csv-parser");
const { Readable } = require("stream");
const db = require("./config/database");

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

function normalizeKey(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeRow(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeKey(key)] = value;
  }
  return normalized;
}

function getFirstValue(row, keys) {
  for (const key of keys) {
    const normalizedKey = normalizeKey(key);
    if (
      Object.prototype.hasOwnProperty.call(row, normalizedKey) &&
      row[normalizedKey] !== undefined &&
      row[normalizedKey] !== null &&
      String(row[normalizedKey]).trim() !== ""
    ) {
      return row[normalizedKey];
    }
  }
  return null;
}

async function parseCsvFromUrl(url) {
  const response = await axios.get(url, {
    timeout: 30000,
    responseType: "text",
  });
  const rows = [];

  await new Promise((resolve, reject) => {
    Readable.from([response.data])
      .pipe(csv())
      .on("data", (row) => rows.push(normalizeRow(row)))
      .on("end", resolve)
      .on("error", reject);
  });

  return rows;
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
    const summary = {
      tripsImported: 0,
      expensesImported: 0,
      expensesBySheet: {},
    };

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

    const resultsTrips = await parseCsvFromUrl(TRIPS_URL);

    if (resultsTrips.length === 0) {
      throw new Error("Trips CSV returned 0 rows");
    }

    for (const row of resultsTrips) {
      const tripId = getFirstValue(row, ["ID", "id"]);
      const destiny = getFirstValue(row, ["LUGAR", "destiny", "destination", "travelDescription", "descripcion"]);
      const month = getFirstValue(row, ["MES", "month"]);
      const year = getFirstValue(row, ["AÑO", "ANIO", "year"]);
      const exchangeRaw = getFirstValue(row, ["CAMBIO DOLAR-PESO", "CAMBIO", "EXCHANGE", "dolarExchange", "cambio"]);

      if (!tripId || !destiny) {
        continue;
      }

      await db.query(
        `INSERT INTO public.trips (id, destiny, month, year, dolarExchange) VALUES ($1, $2, $3, $4, $5)`,
        [tripId, destiny, month, year, cleanAmount(exchangeRaw || "0")]
      );
      summary.tripsImported += 1;
    }

    if (summary.tripsImported === 0) {
      throw new Error("No trips were inserted. Check CSV headers/content in trips sheet.");
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
      const rows = await parseCsvFromUrl(config.url);
      let insertedForSheet = 0;

      for (const row of rows) {
        const description = getFirstValue(row, ["Descripción", "Descripcion", "description", "DESCRIPCION"]);
        const amount = cleanAmount(getFirstValue(row, ["Monto", "monto", "amount"]) || "0");

        if (description && String(description).toUpperCase() !== "TOTAL") {
          await db.query(
            `INSERT INTO public.expenses (type, amount, responsible, travelDescription, travelId, exchange, date)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              description,
              amount,
              getFirstValue(row, ["Responsable", "responsable", "responsible"]),
              config.desc, 
              config.id, 
              getFirstValue(row, ["Cambio", "cambio", "exchange"]),
              parseDate(getFirstValue(row, ["Fecha", "fecha", "date"]))
            ]
          );
          insertedForSheet += 1;
          summary.expensesImported += 1;
        }
      }
      summary.expensesBySheet[config.desc] = insertedForSheet;
      console.log(`✅ Imported: ${config.desc}`);
    }

    if (summary.expensesImported === 0) {
      throw new Error("No expenses were inserted. Check CSV headers/content in expense sheets.");
    }

    console.log("Import success 🚀");
    return summary;
  } catch (err) {
    console.error("❌ ERROR DURANTE LA IMPORTACIÓN:", err);
    throw err;
  }
}

module.exports = { importSheet };