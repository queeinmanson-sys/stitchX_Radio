import os
import requests
from flask import Flask, send_from_directory, jsonify, request
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, "static"),
    static_url_path="/static"
)

@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")

HF_API_KEY = os.environ.get('HF_API_KEY')  # Set this in your environment for security
HF_MODEL = 'distilbert-base-uncased-finetuned-sst-2-english'

@app.route('/api/sentiment', methods=['POST'])
def sentiment():
    data = request.get_json()
    text = data.get('text', '')
    if not text:
        return jsonify({'error': 'Missing text'}), 400

    if not HF_API_KEY:
        return jsonify({'label': 'POSITIVE', 'score': 0.91, 'demo': True})
    headers = {
        'Authorization': f'Bearer {HF_API_KEY}',
        'Content-Type': 'application/json'
    }
    payload = {'inputs': text}
    resp = requests.post(
        f'https://api-inference.huggingface.co/models/{HF_MODEL}',
        headers=headers, json=payload, timeout=8
    )
    if resp.status_code == 200:
        result = resp.json()
        # result: [{'label': 'POSITIVE', 'score': 0.99}]
        label = result[0]['label'] if isinstance(result, list) and result else 'UNKNOWN'
        score = result[0]['score'] if isinstance(result, list) and result else 0.0
        return jsonify({'label': label, 'score': score})
    return jsonify({'error': 'Hugging Face API error', 'details': resp.text}), 500
