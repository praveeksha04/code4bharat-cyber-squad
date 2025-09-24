import React, { useEffect } from "react";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export default function VoiceAssistant({ onCommand }) {
  useEffect(() => {
    // 🔹 Try to unlock audio automatically
    const unlockAudio = () => {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createBufferSource();
      source.buffer = audioCtx.createBuffer(1, 1, 22050);
      source.connect(audioCtx.destination);
      source.start(0);
    };
    unlockAudio();

    const speechConfig = sdk.SpeechConfig.fromSubscription(
      "6FKs7c2RN5nzMP2NyCfxthLFioyf268XHksr58qnDZ8PSjHA7JK2JQQJ99BIACYeBjFXJ3w3AAAYACOGRzIP", // 🔑 your key
      "eastus" // e.g., "eastus"
    );
    speechConfig.speechRecognitionLanguage = "en-US";

    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // --- START with callbacks to catch errors (minimal change) ---
    recognizer.startContinuousRecognitionAsync(
      () => console.log("Recognition started"),
      (err) => console.error("startContinuousRecognitionAsync failed:", err)
    );
    // ----------------------------------------------------------------

    recognizer.recognized = (s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        let transcript = e.result.text.trim().toLowerCase();
        transcript = transcript.replace(/[.?!]/g, "");
        console.log("🎤 Heard:", transcript);

        if (onCommand) onCommand(transcript);
      }
    };

    recognizer.canceled = (s, e) => console.error("❌ Canceled:", e.reason);
    // --- sessionStopped should try to restart but use callbacks to handle errors ---
    recognizer.sessionStopped = () => {
      console.warn("session stopped — attempting restart");
      recognizer.startContinuousRecognitionAsync(
        () => console.log("Recognition restarted"),
        (err) => console.error("restart failed:", err)
      );
    };
    // -------------------------------------------------------------------------------

    // --- CLEANUP: stop first, then close (minimal change) ---
    return () => {
      try {
        if (recognizer) {
          recognizer.stopContinuousRecognitionAsync(
            () => {
              try {
                recognizer.close();
                console.log("Recognizer stopped and closed");
              } catch (e) {
                console.warn("Error closing recognizer after stop:", e);
              }
            },
            (err) => {
              console.error(
                "stopContinuousRecognitionAsync failed during cleanup:",
                err
              );
              try {
                recognizer.close();
              } catch (e) {
                console.warn("Error closing recognizer after failed stop:", e);
              }
            }
          );
        }
      } catch (cleanupErr) {
        console.warn("Cleanup error:", cleanupErr);
        try {
          recognizer && recognizer.close();
        } catch (e) {
            console.log(e);
        }
      }
    };
    // ---------------------------------------------------------------------
  }, [onCommand]);

  return null;
}
