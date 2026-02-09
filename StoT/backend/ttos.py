import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import nltk
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import wordnet, stopwords
from pathlib import Path
from googletrans import Translator
import subprocess
import time

# Download NLTK data (if not already downloaded)
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

lemmatizer = WordNetLemmatizer()
stop_words = set(["mightn't", 're', 'was', 'would', 'be', 'has', 'that', 'does', 'should', 'do', "you've",'off', 'for', "didn't",  'have', "were", 'are', "was", 'its', "haven't", "wouldn't", 'do', 'were', "you'd", "don't", 'does', "hadn't", 'is', 'was', "that", "should've", 'a', 'then', 'the', 'mustn', 'i', 'nor', 'as', "it's", "needn't", 'd', 'am', 'have',  'hasn', 'o', "aren't", "you'll", "couldn't", "you're", "mustn't", 'didn', "doesn't", 'll', 'an', 'hadn', 'whom', 'y', "hasn't", 'itself', 'couldn', 'needn', "shan't", 'isn', 'been', 'such', 'shan', "shouldn't", 'aren', 'being', 'were', 'did', 'ma', 't', 'having', 'mightn', 've', "isn't", "will","won't"])

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize translator
translator = Translator()

# Define the path to your video assets
assets_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'assets'))

print(f"Script directory: {os.path.dirname(os.path.abspath(__file__))}")
print(f"Assets directory: {assets_path}")

# Serve videos from the assets folder
@app.route('/videos/<path:filename>')
def serve_videos(filename):
    video_full_path = os.path.join(assets_path, filename)
    print(f"Attempting to serve video: {video_full_path}")
    print(f"File exists: {os.path.exists(video_full_path)}")
    if os.path.exists(video_full_path):
        file_size = os.path.getsize(video_full_path)
        print(f"File size: {file_size} bytes")
        response = send_from_directory(assets_path, filename)
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Content-Type'] = 'video/mp4'
        print(f"Response headers: {dict(response.headers)}")
        return response
    else:
        print(f"Video file not found: {video_full_path}")
        return jsonify({'error': 'Video not found'}), 404

@app.route('/translate_text', methods=['POST'])
def translate_text():
    try:
        data = request.get_json()
        text = data.get('text')
        target_language = data.get('target_language', 'en')
        
        if not text:
            return jsonify({'error': 'No text provided for translation.'}), 400
        
        # Use Google Translate
        result = translator.translate(text, dest=target_language)
        translated_text = result.text
        
        return jsonify({
            'translated_text': translated_text,
            'source_language': result.src,
            'target_language': target_language
        })
    except Exception as e:
        print(f"Error translating text: {e}")
        return jsonify({'error': 'Failed to translate text.', 'details': str(e)}), 500

@app.route('/speech_to_text', methods=['POST'])
def speech_to_text():
    try:
        data = request.get_json()
        text = data.get('text')
        source_language = data.get('source_language', 'en')

        if not text:
            return jsonify({'error': 'No text provided for speech-to-text.'}), 400

        # Translate speech text to English
        result = translator.translate(text, src=source_language, dest='en')
        translated_text = result.text

        return jsonify({
            'translated_text': translated_text,
            'source_language': source_language,
            'target_language': 'en'
        })
    except Exception as e:
        print(f"Error in speech-to-text translation: {e}")
        return jsonify({'error': 'Failed to process speech-to-text.', 'details': str(e)}), 500



@app.route('/convert_text_to_sign', methods=['POST'])
def convert_text_to_sign():
    try:
        data = request.get_json()
        text_to_convert = data.get('text')

        if not text_to_convert:
            return jsonify({'error': 'No text provided for conversion.'}), 400
        
        tokens = word_tokenize(text_to_convert)
        processed_tokens = []

        for t in tokens:
            if t.lower() == "i":
                processed_tokens.append("me")
            else:
                processed_tokens.append(t)
        
        print(f"Debug: Tokens = {tokens}")

        # Filter out stop words and lemmatize, then convert to uppercase
        filtered_words = []
        for word in processed_tokens:
            lower_word = word.lower()
            lemmatized_word = lemmatizer.lemmatize(lower_word)
            print(f"Debug: Processing word='{word}', lower='{lower_word}', lemmatized='{lemmatized_word}'")

            # Check if the original lowercase word is a stop word
            is_stop_word = lower_word in stop_words
            print(f"Debug: Is '{lower_word}' (original lowercase) in stop_words? {is_stop_word}")

            # Only include alphabetic words that are NOT stop words
            if not is_stop_word and word.isalpha():
                filtered_words.append(lemmatized_word)

        print(f"Debug: Filtered words after processing = {filtered_words}")

        # Generate video URLs for each word
        video_urls = []
        final_keywords = []

        # Function to check if a video file exists
        def video_exists(filename):
            video_path = os.path.join(assets_path, filename)
            return os.path.exists(video_path)

        for word in filtered_words:
            # Try to find a video for the whole word first
            word_video_filename = f"{word.capitalize()}.mp4"
            if video_exists(word_video_filename):
                video_urls.append(f'/videos/{word_video_filename}')
                final_keywords.append(word)
                print(f"✓ Found video for word: {word}")
            else:
                print(f"No video found for word: {word}. Attempting to spell it out.")
                letters_added = False
                for letter in word.upper():
                    letter_video_filename = f"{letter}.mp4"
                    if video_exists(letter_video_filename):
                        video_urls.append(f'/videos/{letter_video_filename}')
                        final_keywords.append(letter)
                        letters_added = True
                        print(f"✓ Found video for letter: {letter}")
                    else:
                        print(f"No video found for letter: {letter}")

                # If no letters found for a word, add a placeholder
                if not letters_added:
                    final_keywords.append(f"[{word.upper()}-NO_SIGN]")

        print(f"Debug: text_to_convert = {text_to_convert}")
        print(f"Debug: filtered_words = {filtered_words}")
        print(f"Debug: final_keywords = {final_keywords}")

        return jsonify({
            'status': 'success',
            'video_urls': video_urls,
            'text': text_to_convert,
            'words': final_keywords
        })
    except Exception as e:
        print(f"Error converting text to sign: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to convert text to sign.', 'details': str(e)}), 500



@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'SignBridge Text-to-Sign Backend is running'})

if __name__ == '__main__':
    print("Starting SignBridge Text-to-Sign Backend...")
    print(f"Assets path: {assets_path}")
    
    # Check if assets directory exists
    if not os.path.exists(assets_path):
        print(f"Creating assets directory: {assets_path}")
        os.makedirs(assets_path)
    
    # List available video files
    if os.path.exists(assets_path):
        video_files = [f for f in os.listdir(assets_path) if f.endswith('.mp4')]
        print(f"Found {len(video_files)} video files in assets directory")
        if video_files:
            print("Sample video files:", video_files[:10])  # Show first 10 files
    
    app.run(host='127.0.0.1', port=5002, debug=True)