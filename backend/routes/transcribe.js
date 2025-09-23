// routes/transcribe.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const axios = require("axios");
const {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
ffmpeg.setFfmpegPath(ffmpegPath);

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_REGION = process.env.AZURE_REGION;
const CONTAINER_NAME = "audio-files";

if (!AZURE_STORAGE_CONNECTION_STRING || !AZURE_SPEECH_KEY || !AZURE_REGION) {
  throw new Error("One or more environment variables are missing.");
}

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const upload = multer({ dest: "uploads/" });

function getSharedKeyCredential() {
  const parts = AZURE_STORAGE_CONNECTION_STRING.split(";");
  const accountName = parts.find((p) => p.startsWith("AccountName="))?.split("=")[1];
  const accountKey = parts.find((p) => p.startsWith("AccountKey="))?.split("=")[1];
  if (!accountName || !accountKey) {
    throw new Error("Could not parse AccountName/AccountKey from Connection String");
  }
  return new StorageSharedKeyCredential(accountName, accountKey);
}
const sharedKeyCredential = getSharedKeyCredential();

async function pollForResult(statusUrl) {
  const headers = { "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY };
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const response = await axios.get(statusUrl, { headers });
    const status = response.data.status;
    console.log(`Polling... current status: ${status}`);

    if (status === "Succeeded") {
      const resultUrl = response.data.links.files;
      const resultResponse = await axios.get(resultUrl, { headers });
      const resultFile = resultResponse.data.values.find((f) => f.kind === "Transcription");

      if (!resultFile) throw new Error("Transcription result file not found.");

      const transcriptionResponse = await axios.get(resultFile.links.contentUrl);
      return transcriptionResponse.data;
    } else if (status === "Failed") {
      throw new Error(
        `Transcription failed: ${response.data.properties?.error?.message || "Unknown error"}`
      );
    }
  }
}

router.post("/", upload.single("video"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video file uploaded." });
  }

  const tempAudioPath = path.join(__dirname, "..", `temp-audio-${Date.now()}.wav`);
  const originalUploadedPath = req.file.path;
  let blobNameToDelete = null;

  try {
    console.log("Extracting audio with FFmpeg...");
    await new Promise((resolve, reject) => {
      ffmpeg(originalUploadedPath)
        .toFormat("wav")
        .audioCodec("pcm_s16le")
        .audioFrequency(16000)
        .audioChannels(1)
        .on("error", (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
        .on("end", () => resolve())
        .save(tempAudioPath);
    });

    const blobName = `audio-${Date.now()}.wav`;
    blobNameToDelete = blobName;
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.uploadFile(tempAudioPath);
    console.log(`Uploaded '${blobName}' to Azure Blob Storage.`);

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: CONTAINER_NAME,
        blobName: blobName,
        permissions: BlobSASPermissions.parse("r"),
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + 3600 * 1000),
      },
      sharedKeyCredential
    ).toString();
    const sasUrl = `${blockBlobClient.url}?${sasToken}`;

    console.log("Starting batch transcription job...");
    const speechToTextEndpoint = `https://${AZURE_REGION}.api.cognitive.microsoft.com/speechtotext/v3.1/transcriptions`;
    const jobResponse = await axios.post(
      speechToTextEndpoint,
      {
        contentUrls: [sasUrl],
        locale: "en-US",
        displayName: "Hackathon Transcription Job",
        properties: {
          punctuationMode: "DictatedAndAutomatic",
          wordLevelTimestampsEnabled: true,
        },
      },
      {
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const transcriptionData = await pollForResult(jobResponse.data.self);

    console.log("✅ Transcription successful.");
    res.json(transcriptionData); // send full JSON (not wrapped)
  } catch (error) {
    console.error("An error occurred:", error.response ? JSON.stringify(error.response.data) : error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (fs.existsSync(originalUploadedPath)) fs.unlinkSync(originalUploadedPath);
    if (fs.existsSync(tempAudioPath)) fs.unlinkSync(tempAudioPath);
    if (blobNameToDelete) {
      try {
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
        await containerClient.deleteBlob(blobNameToDelete);
        console.log(`Deleted blob '${blobNameToDelete}'.`);
      } catch (delError) {
        console.error("Error deleting blob:", delError.message);
      }
    }
  }
});

module.exports = router;
