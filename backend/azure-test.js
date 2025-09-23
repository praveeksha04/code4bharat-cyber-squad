// azure-test.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const speechsdk = require('microsoft-cognitiveservices-speech-sdk');

// This is the same transcription function from your main file
function transcribeAudio(filePath) {
    return new Promise((resolve, reject) => {
        const speechConfig = speechsdk.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);
        speechConfig.speechRecognitionLanguage = "en-US";

        const pushStream = speechsdk.AudioInputStream.createPushStream();
        fs.createReadStream(filePath)
            .on('data', (arrayBuffer) => pushStream.write(arrayBuffer.slice()))
            .on('end', () => pushStream.close());

        const audioConfig = speechsdk.AudioConfig.fromStreamInput(pushStream);
        const speechRecognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);
        let fullText = "";

        speechRecognizer.recognized = (s, e) => {
            if (e.result.reason === speechsdk.ResultReason.RecognizedSpeech) {
                fullText += e.result.text + " ";
            }
        };
        speechRecognizer.sessionStopped = (s, e) => {
            speechRecognizer.stopContinuousRecognitionAsync(() => {
                speechRecognizer.close();
                resolve(fullText.trim());
            });
        };
        speechRecognizer.canceled = (s, e) => {
            let errorMessage = `Azure Canceled: Reason=${speechsdk.CancellationReason[e.reason]}`;
            if (e.reason === speechsdk.CancellationReason.Error) {
                errorMessage += ` | ErrorDetails=${e.errorDetails}`;
            }
            speechRecognizer.close();
            reject(new Error(errorMessage));
        };
        speechRecognizer.startContinuousRecognitionAsync();
    });
}

// --- Main Test Execution ---
async function runTest() {
    try {
        const testAudioPath = path.join(__dirname, 'test.wav');
        console.log("--- RUNNING FINAL AZURE TEST ---");
        console.log("Using Key:", process.env.SPEECH_KEY ? 'Loaded' : 'NOT FOUND');
        console.log("Using Region:", process.env.SPEECH_REGION);

        const transcription = await transcribeAudio(testAudioPath);

        console.log("\n✅✅✅ TEST SUCCEEDED! ✅✅✅");
        console.log("Transcription:", transcription);

    } catch (error) {
        console.error("\n❌❌❌ TEST FAILED ❌❌❌");
        console.error(error);
    }
}

runTest();