
import { ensureActiveColumnExists } from "./src/utils/helperFunctions.js";
import { pool } from "./src/config/mySQLConfig.js";

async function addCol() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log("Checking if paper_solutions column exists...");
        const [rows] = await connection.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = 'papergeneration' AND TABLE_NAME = 'question_papers' AND COLUMN_NAME = 'paper_solutions'`
        );
        
        if (rows.length === 0) {
            console.log("Adding paper_solutions column...");
            await connection.execute(`
                ALTER TABLE question_papers
                ADD COLUMN paper_solutions LONGTEXT
            `);
            console.log("Column added.");
        } else {
            console.log("Column already exists.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        if(connection) connection.release();
        process.exit();
    }
}

addCol();
