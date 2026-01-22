import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASS = process.env.DB_PASS || "";
const DB_NAME = process.env.DB_NAME || "papergeneration";

export const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  connectionLimit: 10,
  waitForConnections: true,
});

process.on("SIGINT", async () => {
  console.log("\nClosing MySQL pool...");
  try {
    await pool.end();
    console.log("MySQL pool closed successfully.");
  } catch (e) {
    console.error("Error closing MySQL pool:", e);
  }
  process.exit();
});
