
import { pool } from "./src/config/mySQLConfig.js";

async function verify() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'question_papers' AND COLUMN_NAME = 'paper_solutions'`
        );
        if (rows.length > 0) {
            console.log("VERIFICATION SUCCESS: paper_solutions column exists.");
        } else {
            console.error("VERIFICATION FAILED: paper_solutions column NOT found.");
        }
    } catch (err) {
        console.error("Verification Error:", err);
    } finally {
        if(connection) connection.release();
        process.exit();
    }
}
verify();
