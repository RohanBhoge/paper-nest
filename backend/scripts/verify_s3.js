import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load env from one level up
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function listBuckets() {
  console.log("Checking S3 Bucket Contents...");
  console.log("Region:", process.env.AWS_REGION);
  console.log("Bucket:", process.env.AWS_BUCKET_NAME);

  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_BUCKET_NAME,
    MaxKeys: 10 // Checking last 10 items
  });

  try {
    const response = await s3Client.send(command);
    console.log("------------------------------------------------");
    if (response.Contents) {
      console.log(`Found ${response.Contents.length} objects:`);
      response.Contents.forEach((item) => {
        console.log(` - Key: ${item.Key} | Size: ${item.Size} | LastModified: ${item.LastModified}`);
      });
    } else {
      console.log("Bucket is empty or no objects found.");
    }
    console.log("------------------------------------------------");
    console.log("✅ S3 Connection Verified");
  } catch (err) {
    console.error("❌ S3 Error:", err);
  }
}

listBuckets();
