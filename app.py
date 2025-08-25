from flask import Flask, request, jsonify, render_template
import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Initialize Flask app
app = Flask(__name__)

@app.route('/')
def home():
    return render_template('login.html')

@app.route('/home')
def home2():
    return render_template('hemotouch.html')

@app.route('/config')
def config():
    return jsonify({
        'API_URL': os.environ.get('API_URL'),
        'PREDICT_API_URL': os.environ.get('PREDICT_API_URL')
    })

@app.route('/predict', methods=['POST'])
def predict():
    try:
        file = request.files.get('file')
        if not file:
            return jsonify({'error': 'No file provided'}), 400

        # Get the Hugging Face API URL from environment variables
        predict_api_url = os.environ.get('PREDICT_API_URL')
        if not predict_api_url:
            return jsonify({'error': 'PREDICT_API_URL not configured'}), 500

        # Forward the file to the Hugging Face API
        files = {'file': (file.filename, file.read(), file.content_type)}
        response = requests.post(predict_api_url, files=files)
        response.raise_for_status() # Raise an exception for bad status codes

        return jsonify(response.json())

    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Failed to connect to prediction service: {e}'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('FLASK_DEBUG', '0') == '1')