from flask import Flask, request, jsonify, render_template
import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
import io
from collections import Counter

# Initialize Flask app
app = Flask(__name__)

# Load all models
model_paths = [
    'C:/Mini Project/web/V3_model.keras',
    'C:/Mini Project/web/best_model.keras',
    'C:/Mini Project/web/V1_model.keras',
    'C:/Mini Project/web/V2_model.keras'
]
models = [load_model(path) for path in model_paths]

@app.route('/')
def home():
    # Render the index.html file
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Define blood type classes
        class_names = ['A+', 'A-', 'AB+', 'AB-', 'B+', 'B-', 'O+', 'O-']

        # Get the image file from the POST request
        file = request.files.get('file')
        if not file:
            return jsonify({'error': 'No file provided'}), 400

        # Read the image in the required format (assuming it's in JPEG/PNG format)
        image = Image.open(io.BytesIO(file.read())).convert('RGB')
        image = image.resize((64, 64))  # Resize to 64x64 pixels as expected by the models
        image_array = np.array(image) / 255.0  # Convert the image to a numpy array and normalize

        # Reshape to match the models' expected input (batch size, height, width, channels)
        image_array = np.expand_dims(image_array, axis=0)

        # Get predictions from all models
        predictions = []
        for model in models:
            prediction = model.predict(image_array)[0]
            predicted_index = np.argmax(prediction)
            predictions.append(predicted_index)

        # Tally votes
        vote_counts = Counter(predictions)
        most_voted = vote_counts.most_common()

        # Check for ties and resolve by chronological order if needed
        if len(most_voted) > 1 and most_voted[0][1] == most_voted[1][1]:
            tied_classes = [class_index for class_index, votes in most_voted if votes == most_voted[0][1]]
            most_voted_index = min(tied_classes)
        else:
            most_voted_index = most_voted[0][0]

        # Get the predicted class name
        predicted_class = class_names[most_voted_index]
        print(predicted_class)
        return jsonify({'prediction': predicted_class})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
