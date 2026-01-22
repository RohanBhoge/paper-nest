const fs = require('fs');
const path = require('path');

const inputFileName = 'converter.json';
const outputFileName = 'converter.json';

const filePath = path.join(__dirname, inputFileName);

try {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const rawData = fs.readFileSync(filePath, 'utf8');
    let mcqData = JSON.parse(rawData);

    function updateValues(data, key, value, startId) {
        if (!Array.isArray(data)) {
            console.error("Provided data is not an array.");
            return data;
        }

        console.log(`Processing ${data.length} items...`);

        const startIdNum = (startId !== undefined && startId !== null && startId !== "") ? parseInt(startId) : null;

        data.forEach((item, index) => {
            if (key) {
                item[key] = value;
            }
            if (startIdNum !== null && !isNaN(startIdNum)) {
                item.id = startIdNum + index;
            }
        });

        if (key) {
            console.log(`Updated key '${key}' with value '${value}' for all items.`);
        }
        if (startIdNum !== null && !isNaN(startIdNum)) {
            console.log(`Updated 'id' starting from ${startIdNum}.`);
        }
        return data;
    }

    const targetKey = "chapter";
    const targetValue = "Plant Kingdom";
    const startId = 141;

    const updatedData = updateValues(mcqData, targetKey, targetValue, startId);

    const outputFilePath = path.join(__dirname, outputFileName);
    fs.writeFileSync(outputFilePath, JSON.stringify(updatedData, null, 2), 'utf8');

    console.log(`✅ Success! Data saved to ${outputFileName}`);

} catch (error) {
    console.error("Error processing file:", error.message);
}
