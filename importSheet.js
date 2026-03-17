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

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  user: process.env.PGUSER || "admin",
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "appdb",
  password: process.env.PGPASSWORD || "admin",
  port: process.env.PGPORT || 5432,
  ssl: process.env.DATABASE_URL 
    ? { rejectUnauthorized: false } 
    : false
});

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
      // Crear tabla trips si no existe
    await pool.query(`
      CREATE TABLE trips (
        id SERIAL PRIMARY KEY,
        destiny VARCHAR(255),
        month VARCHAR(50),
        year VARCHAR(50),
        dolarExchange DECIMAL(10,2) NOT NULL
      );
    `);
    await pool.query(`TRUNCATE TABLE trips;`);
    const responseTrips = await axios.get(TRIPS_URL);
    const resultsTrips = [];

    await new Promise((resolve, reject) => {
      Readable.from(responseTrips.data)
        .pipe(csv())
        .on("data", (row) => {
          resultsTrips.push(row);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    for (const row of resultsTrips) {
      const id = row["ID"];
      const destiny = row["LUGAR"];
      const month = row["MES"];
      const year = row["AÑO"];
      const dolarExchange = cleanAmount(row["CAMBIO DOLAR-PESO"]);
        await pool.query(
        `
        INSERT INTO trips (id, destiny, month, year,dolarExchange)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [id, destiny, month, year, dolarExchange],
      );

      console.log("Inserted:", destiny);
      
    }

    await pool.query(`DROP TABLE IF EXISTS expenses;`);
    await pool.query(`
      CREATE TABLE expenses (
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
    await pool.query(`TRUNCATE TABLE expenses;`);

    console.log("Tabla expenses limpiada");

    
    const responseCancun = await axios.get(CANCUN_2024_URL);
    const responseMardel = await axios.get(MARDEL_ENERO_2025_URL);
    const responseBrc = await axios.get(BRC_2025_URL);
    const responseCarilo = await axios.get(CARILO_2025_URL);
    const responseBuzios = await axios.get(BUZIOS_2025_URL);
    const responsePanama = await axios.get(PANAMA_2026_URL);

    const results = [];

    await new Promise((resolve, reject) => {
      Readable.from(responseCancun.data)
        .pipe(csv())
        .on("data", (row) => {
          results.push({ ...row, travelDescription: "Cancún 2024",travelId:"2" });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // MARDEL ENERO 2025
    await new Promise((resolve, reject) => {
      Readable.from(responseMardel.data)
        .pipe(csv())
        .on("data", (row) => {
          results.push({ ...row, travelDescription: "Mardel 2025",travelId:"3" });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // BRC 2025
    await new Promise((resolve, reject) => {
      Readable.from(responseBrc.data)
        .pipe(csv())
        .on("data", (row) => {
          results.push({ ...row, travelDescription: "BRC 2025",travelId:"4" });
        })
        .on("end", resolve)
        .on("error", reject);
    });
    
    // CARILO 2025
    await new Promise((resolve, reject) => {
      Readable.from(responseCarilo.data)
        .pipe(csv())
        .on("data", (row) => {
          results.push({ ...row, travelDescription: "Cariló 2025",travelId:"5" });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // BUZIOS 2025
     await new Promise((resolve, reject) => {
      Readable.from(responseBuzios.data)
        .pipe(csv())
        .on("data", (row) => {
          results.push({ ...row, travelDescription: "Buzios 2025",travelId:"6" });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    // PANAMA 2026
     await new Promise((resolve, reject) => {
      Readable.from(responsePanama.data)
        .pipe(csv())
        .on("data", (row) => {
          results.push({ ...row, travelDescription: "Panama 2026",travelId:"7" });
        })
        .on("end", resolve)
        .on("error", reject);
    });

    console.log("Filas leídas:", results.length);

    for (const row of results) {
      const type = row["Descripción"];
      const cost = cleanAmount(row["Monto"]);
      const responsible = row["Responsable"];
      const travelDescription = row["travelDescription"];
      const travelId = row["travelId"];
      const exchange = row["Cambio"];
      let date = null;
      if (row["Fecha"]) {
        date = parseDate(row["Fecha"]);
        console.log(`Parsed date for ${type}:`, date);
      }
      if (type!=="TOTAL") {
        await pool.query(
        `
        INSERT INTO expenses (type, amount, responsible, paymentMethod, travelDescription, travelId, exchange, date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [type, cost, responsible, null, travelDescription, travelId, exchange, date],
      );

      console.log("Inserted:", type);}
      
    }

    console.log("Import success 🚀");
  } catch (err) {
    console.error("ERROR:", err);
  }
}

export { importSheet };
