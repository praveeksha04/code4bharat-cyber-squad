# app.py

import os
import requests
import time
import json
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from azure.storage.blob import BlobServiceClient, BlobSasPermissions, generate_blob_sas
from datetime import datetime, timedelta
import subprocess

# --- SETUP ---
load_dotenv()
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Azure credentials
SPEECH_KEY = os.getenv('SPEECH_KEY')
SPEECH_REGION = os.getenv('SPEECH_REGION')
AZURE_STORAGE_CONNECTION_STRING = os.getenv('AZURE_STORAGE_CONNECTION_STRING')
CONTAINER_NAME = 'audio-files'


# --- API ENDPOINT ---
@app.route('/api/transcribe', methods=['POST'])
def transcribe_video():
    if 'video' not in request.files:
        return jsonify({"error": "No video file part"}), 400
    file = request.files['video']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # --- 1. SAVE & CONVERT FILE ---
    original_filename = secure_filename(file.filename)
    original_filepath = os.path.join(app.config['UPLOAD_FOLDER'], original_filename)
    file.save(original_filepath)

    temp_audio_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp-audio-{int(time.time())}.wav")
    
    print("Extracting audio with FFmpeg...")
    try:
        # Use subprocess to call ffmpeg
        subprocess.run([
            'ffmpeg', '-i', original_filepath, '-acodec', 'pcm_s16le',
            '-ac', '1', '-ar', '16000', temp_audio_path
        ], check=True)
    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"FFmpeg failed: {e}"}), 500

    # --- 2. UPLOAD TO BLOB STORAGE ---
    print("Uploading to Azure Blob Storage...")
    blob_service_client = BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)
    blob_name = os.path.basename(temp_audio_path)
    blob_client = blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=blob_name)
    
    with open(temp_audio_path, "rb") as data:
        blob_client.upload_blob(data, overwrite=True)

    # Generate SAS URL
    sas_token = generate_blob_sas(
        account_name=blob_service_client.account_name,
        container_name=CONTAINER_NAME,
        blob_name=blob_name,
        account_key=blob_service_client.credential.account_key,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.utcnow() + timedelta(hours=1)
    )
    sas_url = f"{blob_client.url}?{sas_token}"
    
    # --- 3. START BATCH TRANSCRIPTION ---
    print("Starting batch transcription job...")
    endpoint = f"https://{SPEECH_REGION}.api.cognitive.microsoft.com/speechtotext/v3.1/transcriptions"
    payload = {
        "contentUrls": [sas_url],
        "locale": "en-US",
        "displayName": "Hackathon Transcription",
        "properties": {"punctuationMode": "DictatedAndAutomatic"}
    }
    headers = {"Ocp-Apim-Subscription-Key": SPEECH_KEY, "Content-Type": "application/json"}
    
    response = requests.post(endpoint, json=payload, headers=headers)
    status_url = response.json()['self']

    # --- 4. POLL FOR RESULT ---
    print("Polling for result...")
    transcription = ""
    while True:
        status_response = requests.get(status_url, headers=headers)
        status_json = status_response.json()
        print(f"Polling... status: {status_json['status']}")
        if status_json['status'] == 'Succeeded':
            result_url = status_json['links']['files']
            result_files_response = requests.get(result_url, headers=headers)
            transcription_url = next(f['links']['contentUrl'] for f in result_files_response.json()['values'] if f['kind'] == 'Transcription')
            transcription_response = requests.get(transcription_url)
            transcription = " ".join([p['display'] for p in transcription_response.json()['recognizedPhrases']])
            break
        elif status_json['status'] == 'Failed':
            transcription = f"Transcription Failed: {status_json['properties']['error']['message']}"
            break
        time.sleep(5)

    # --- 5. CLEANUP ---
    print("Cleaning up files...")
    os.remove(original_filepath)
    os.remove(temp_audio_path)
    blob_client.delete_blob()

    return jsonify({"transcription": transcription})

if __name__ == '__main__':
    app.run(port=5001, debug=True)