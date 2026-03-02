const axios = require("axios");
const csv = require("csv-parser");
const { Pool } = require("pg");
const { Readable } = require("stream");

const pool = new Pool({
  user: "admin",
  host: "localhost",
  database: "appdb",
  password: "admin",
  port: 5432,
});

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzheqd-dJNyaSL4m0EoCM1K4Jir9YlV9EQUVKrJiNKhQs-0TLbIGZkVmpw2fnX7MzJWOA0NSAzsdGZ/pub?gid=1589138416&single=true&output=csv";

async function importSheet() {
  try {
    const response = await axios.get(SHEET_URL);

    const results = [];

    await new Promise((resolve, reject) => {
      Readable.from(response.data)
        .pipe(csv())
        .on("data", (row) => {
          results.push(row);
        })
        .on("end", resolve)
        .on("error", reject);
    });

    console.log("Filas leídas:", results.length);

    for (const row of results) {
      const type = row["Tipo de Gasto"];
      const cost = parseFloat(row["Monto"]);
      const responsible = row["Responsable"];

      await pool.query(
        `
        INSERT INTO expenses (type, amount, responsible, paymentMethod, date)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [type, cost, responsible, null, null],
      );

      console.log("Inserted:", type);
    }

    console.log("Import success 🚀");
    process.exit();
  } catch (err) {
    console.error("ERROR:", err);
  }
}

importSheet();
