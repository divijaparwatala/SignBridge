from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import math
import json
import base64
import os
import time
import traceback
import pyttsx3
from keras.models import load_model
from cvzone.HandTrackingModule import HandDetector
from string import ascii_uppercase

# Safe spell checker import
try:
    from spellchecker import SpellChecker
    spell = SpellChecker()
    print("✓ SpellChecker loaded successfully")
except Exception as e:
    print(f"SpellChecker error: {e}")
    print("Using simple word completion instead")
    class SimpleSpellChecker:
        def candidates(self, word):
            return [word]
    spell = SimpleSpellChecker()

app = Flask(__name__)
CORS(app)

# Initialize components (exact from webtrial2.py)
hd = HandDetector(maxHands=2, detectionCon=0.5, minTrackCon=0.5)
offset = 29

# Get the directory where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(script_dir, 'models')

print(f"Script directory: {script_dir}")
print(f"Models directory: {models_dir}")

# Load models (exact from webtrial2.py)
try:
    # Load old model for specific letters
    old_model_path = os.path.join(models_dir, 'isl_model_v2.h5')
    old_indices_path = os.path.join(models_dir, 'class_indices.json')
    
    if os.path.exists(old_model_path):
        old_model = load_model(old_model_path)
        with open(old_indices_path, 'r') as f:
            old_class_indices = json.load(f)
        print("✓ Loaded old model successfully")
    else:
        print(f"❌ Old model not found at: {old_model_path}")
        old_model = None
        old_class_indices = {}
    
    # Load best skeletal model
    best_model_path = os.path.join(models_dir, 'best_skeletal_model.h5')
    best_indices_path = os.path.join(models_dir, 'skeletal_class_indices.json')
    
    if os.path.exists(best_model_path):
        best_model = load_model(best_model_path)
        with open(best_indices_path, 'r') as f:
            best_class_indices = json.load(f)
        print("✓ Loaded best skeletal model successfully")
    else:
        print(f"❌ Best model not found at: {best_model_path}")
        best_model = None
        best_class_indices = {}
    
    # Load big skeletal model
    big_model_path = os.path.join(models_dir, 'big_skeletal_model.h5')
    big_indices_path = os.path.join(models_dir, 'skeletal_class_indices2.json')
    
    if os.path.exists(big_model_path):
        big_model = load_model(big_model_path)
        with open(big_indices_path, 'r') as f:
            big_class_indices = json.load(f)
        print("✓ Loaded big skeletal model successfully")
    else:
        print(f"❌ Big model not found at: {big_model_path}")
        big_model = None
        big_class_indices = {}
    
    # Check if at least one model loaded
    if not any([old_model, best_model, big_model]):
        print("❌ No models could be loaded!")
    else:
        print("✓ At least one model loaded successfully")
        
except Exception as e:
    print(f"Error loading models: {str(e)}")
    traceback.print_exc()

# Define which model works better for which letters (exact from webtrial2.py)
old_model_letters = ['A', 'T', 'B', 'X']
best_model_letters = ['B', 'C', 'G', 'I', 'J', 'L', 'M', 'S', 'V', 'X','Z','Q','R']
big_model_letters = ['D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P','U', 'V', 'W','Y','R']

# Initialize text-to-speech engine
try:
    speak_engine = pyttsx3.init()
    speak_engine.setProperty("rate", 100)
    voices = speak_engine.getProperty("voices")
    if voices:
        speak_engine.setProperty("voice", voices[0].id)
    print("✓ TTS engine initialized")
except Exception as e:
    print(f"TTS initialization error: {e}")
    speak_engine = None

# Global variables for tracking state (EXACT from webtrial2.py)
current_symbol = "C"
prev_char = " "
str_text = " "
count = -1
ten_prev_char = [" "] * 10
last_next_time = 0
next_gesture_counter = 0
last_valid_symbol = ""

# Word suggestion variables (exact from webtrial2.py)
word1 = " "
word2 = " "
word3 = " "
word4 = " "
word1_sug = " "
word2_sug = " "
word3_sug = " "
word4_sug = " "

# Additional timing variables for gesture detection
last_prediction_time = 0
gesture_start_time = 0
consistent_gesture_count = 0
last_gesture_type = ""

last_appended_symbol = ""  # Track the last symbol that was appended to prevent duplicates

# Add these global variables at the top with other globals (around line 108)
# Additional variables for prediction indices
current_top3_idx = [0, 1, 2]  # Default fallback indices
last_used_model = "big"  # Track which model was used

def distance(x, y):
    """Calculate distance between two points (exact from webtrial2.py)"""
    return math.sqrt(((x[0] - y[0]) ** 2) + ((x[1] - y[1]) ** 2))

def is_finger_straight(finger_points):
    """Check if a finger is straight by analyzing angles between joints (exact from webtrial2.py)"""
    try:
        angle1 = calculate_angle(finger_points[0], finger_points[1], finger_points[2])
        angle2 = calculate_angle(finger_points[1], finger_points[2], finger_points[3])
        return angle1 > 160 and angle2 > 160
    except:
        return False

def calculate_angle(p1, p2, p3):
    """Calculate angle between three points (exact from webtrial2.py)"""
    try:
        v1 = np.array([p1[0] - p2[0], p1[1] - p2[1]])
        v2 = np.array([p3[0] - p2[0], p3[1] - p2[1]])
        angle = np.degrees(np.arccos(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))))
        return angle
    except:
        return 0

def calculate_curl(finger_points):
    """Calculate how much a finger is curled (exact from webtrial2.py)"""
    try:
        start = np.array(finger_points[0])
        mid = np.array(finger_points[2])
        end = np.array(finger_points[3])
        return calculate_angle(start, mid, end)
    except:
        return 0

def analyze_hand_shape(landmarks):
    """Analyze hand shape to distinguish between similar letters (exact from webtrial2.py)"""
    try:
        if len(landmarks) == 42:  # Two hands detected
            hand1 = landmarks[:21]
            hand2 = landmarks[21:]
            
            is_d = check_two_handed_d(hand1, hand2)
            if is_d:
                print("Detected two-handed 'D' gesture")
                return 'D'
            return None
        
        palm_width = distance(landmarks[5], landmarks[17])
        
        features = {
            'thumb_angle': calculate_angle(landmarks[0], landmarks[2], landmarks[4]),
            'index_straight': is_finger_straight(landmarks[5:9]),
            'middle_straight': is_finger_straight(landmarks[9:13]),
            'ring_curl': calculate_curl(landmarks[13:17]),
            'pinky_curl': calculate_curl(landmarks[17:21]),
            'index_middle_distance': distance(landmarks[8], landmarks[12]),
            'index_tip_y': landmarks[8][1],
            'middle_tip_y': landmarks[12][1],
            'index_middle_angle': calculate_angle(landmarks[5], landmarks[9], landmarks[12]),
            'index_middle_parallel': abs(calculate_angle(landmarks[6], landmarks[8], [landmarks[8][0], landmarks[8][1]-10]) - 
                                      calculate_angle(landmarks[10], landmarks[12], [landmarks[12][0], landmarks[12][1]-10])),
            'ring_pinky_separation': distance(landmarks[16], landmarks[20]) / palm_width,
            'middle_ring_separation': distance(landmarks[12], landmarks[16]) / palm_width,
        }
        
        is_d = (
            features['index_straight'] and
            features['middle_straight'] and
            features['ring_curl'] > 30 and
            features['pinky_curl'] > 30 and
            abs(features['index_tip_y'] - features['middle_tip_y']) < palm_width * 0.2 and
            features['index_middle_distance'] < palm_width * 0.3 and
            features['index_middle_angle'] < 25 and
            features['index_middle_parallel'] < 20 and
            features['middle_ring_separation'] > 0.3 and
            features['ring_pinky_separation'] < 0.4
        )
        
        if is_d:
            print("Detected single-handed 'D' gesture")
            return 'D'
        elif features['index_straight'] and not features['middle_straight']:
            return 'B'
        elif all(features[f'{finger}_curl'] > 45 for finger in ['ring', 'pinky']):
            return 'O'
        elif features['thumb_angle'] > 45:
            return 'Z'
        else:
            return 'C'
            
    except Exception as e:
        print(f"Error in hand shape analysis: {str(e)}")
        return None

def check_two_handed_d(hand1, hand2):
    """Check for two-handed D gesture (exact from webtrial2.py)"""
    try:
        return (is_index_up_hand(hand1) and is_c_shape_hand(hand2)) or \
               (is_index_up_hand(hand2) and is_c_shape_hand(hand1))
    except Exception as e:
        print(f"Error in two-handed D detection: {str(e)}")
        return False

def is_index_up_hand(landmarks):
    """Check if hand is showing index finger up (exact from webtrial2.py)"""
    try:
        index_straight = is_finger_straight(landmarks[5:9])
        middle_curl = calculate_curl(landmarks[9:13])
        ring_curl = calculate_curl(landmarks[13:17])
        pinky_curl = calculate_curl(landmarks[17:21])
        
        index_vertical = abs(landmarks[8][0] - landmarks[5][0]) < 30
        
        is_valid = (
            index_straight and
            middle_curl > 30 and
            ring_curl > 30 and
            pinky_curl > 30 and
            index_vertical
        )
        
        if is_valid:
            print("Detected index up hand")
        return is_valid
    except Exception as e:
        print(f"Error checking index up hand: {str(e)}")
        return False

def is_c_shape_hand(landmarks):
    """Check if hand is making a C shape (exact from webtrial2.py)"""
    try:
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        middle_tip = landmarks[12]
        ring_tip = landmarks[16]
        pinky_tip = landmarks[20]
        
        all_fingers_curved = all(
            30 < calculate_curl(landmarks[i:i+4]) < 120
            for i in [5, 9, 13, 17]
        )
        
        tips_y_sorted = sorted([thumb_tip[1], index_tip[1], middle_tip[1], ring_tip[1], pinky_tip[1]])
        tips_form_curve = abs(tips_y_sorted[-1] - tips_y_sorted[0]) < 100
        
        is_valid = all_fingers_curved and tips_form_curve
        
        if is_valid:
            print("Detected C shape hand")
        return is_valid
    except Exception as e:
        print(f"Error checking C shape hand: {str(e)}")
        return False

def predict(test_image, hands):
    """EXACT prediction function from webtrial2.py"""
    global current_symbol, prev_char, str_text, count, ten_prev_char, last_valid_symbol
    global word1, word2, word3, word4, word1_sug, word2_sug, word3_sug, word4_sug
    global current_top3_idx, last_used_model  # Add these globals
    
    try:
        # First check if hands are detected
        if not hands:
            return

        # Check if all models are loaded
        if not all([old_model, best_model, big_model]):
            print("Some models not loaded, skipping prediction")
            return

        # Proceed with normal letter recognition (EXACT from webtrial2.py)
        old_input = cv2.resize(test_image, (256, 256))
        old_input = old_input.astype(np.float32) / 255.0
        
        best_input = cv2.resize(test_image, (224, 224))
        best_input = best_input.astype(np.float32) / 255.0
        
        big_input = cv2.resize(test_image, (256, 256))
        big_input = big_input.astype(np.float32) / 255.0
        
        # Get predictions from all models
        old_predictions = old_model.predict(old_input.reshape(1, 256, 256, 3), verbose=0)[0]
        best_predictions = best_model.predict(best_input.reshape(1, 224, 224, 3), verbose=0)[0]
        big_predictions = big_model.predict(big_input.reshape(1, 256, 256, 3), verbose=0)[0]
        
        # Get top predictions from all models
        old_top3_idx = np.argsort(old_predictions)[-3:][::-1]
        best_top3_idx = np.argsort(best_predictions)[-3:][::-1]
        big_top3_idx = np.argsort(big_predictions)[-3:][::-1]
        
        old_predicted_letter = list(old_class_indices.keys())[old_top3_idx[0]]
        best_predicted_letter = list(best_class_indices.keys())[best_top3_idx[0]]
        big_predicted_letter = list(big_class_indices.keys())[big_top3_idx[0]]
        
        # Print confidence scores for debugging
        print(f"Old model prediction: {old_predicted_letter} with confidence: {old_predictions[old_top3_idx[0]]:.2f}")
        print(f"Best model prediction: {best_predicted_letter} with confidence: {best_predictions[best_top3_idx[0]]:.2f}")
        print(f"Big model prediction: {big_predicted_letter} with confidence: {big_predictions[big_top3_idx[0]]:.2f}")
        
        # Check for special letters (EXACT logic from webtrial2.py)
        special_letters = ['F','Q','R','D','K', 'T', 'P','W','I']
        predicted_letters = [old_predicted_letter, best_predicted_letter, big_predicted_letter]
        
        # Initialize defaults
        top3_idx = big_top3_idx
        model_used = "big"
        
        # First check for S with G or O or P combinations
        if 'S' in predicted_letters and all(letter in ['G', 'O', 'P', 'S'] for letter in predicted_letters):
            s_predictions = []
            if old_predicted_letter == 'S':
                s_predictions.append((old_predictions[old_top3_idx[0]], old_predictions, old_top3_idx, 'old'))
            if best_predicted_letter == 'S':
                s_predictions.append((best_predictions[best_top3_idx[0]], best_predictions, best_top3_idx, 'best'))
            if big_predicted_letter == 'S':
                s_predictions.append((big_predictions[big_top3_idx[0]], big_predictions, big_top3_idx, 'big'))
            
            if s_predictions:
                conf, preds, idx, model_name = max(s_predictions, key=lambda x: x[0])
                print(f"Detected S with G/O/P combination, using {model_name} model's prediction with confidence: {conf:.2f}")
                current_symbol = 'S'
                predictions = preds
                top3_idx = idx
                model_used = model_name
        else:
            # Check for other special letters
            for special_letter in special_letters:
                if special_letter in predicted_letters:
                    special_predictions = []
                    if old_predicted_letter == special_letter:
                        special_predictions.append((old_predictions[old_top3_idx[0]], old_predictions, old_top3_idx, 'old'))
                    if best_predicted_letter == special_letter:
                        special_predictions.append((best_predictions[best_top3_idx[0]], best_predictions, best_top3_idx, 'best'))
                    if big_predicted_letter == special_letter:
                        special_predictions.append((big_predictions[big_top3_idx[0]], big_predictions, big_top3_idx, 'big'))
                    
                    if special_predictions:
                        conf, preds, idx, model_name = max(special_predictions, key=lambda x: x[0])
                        if conf > 0.8:
                            print(f"Detected {special_letter} with confidence: {conf:.2f} from {model_name} model")
                            current_symbol = special_letter
                            predictions = preds
                            top3_idx = idx
                            model_used = model_name
                            break
                        else:
                            return
            else:
                # EXACT majority voting logic from webtrial2.py
                all_predictions = [
                    (old_predictions[old_top3_idx[0]], old_predicted_letter, old_predictions, old_top3_idx, 'old'),
                    (best_predictions[best_top3_idx[0]], best_predicted_letter, best_predictions, best_top3_idx, 'best'),
                    (big_predictions[big_top3_idx[0]], big_predicted_letter, big_predictions, big_top3_idx, 'big')
                ]
                
                perfect_predictions = [pred for pred in all_predictions if pred[0] == 1.0]
                if perfect_predictions:
                    other_predictions = [pred for pred in all_predictions if pred[0] != 1.0]
                    if len(other_predictions) >= 2:
                        other_letters = [pred[1] for pred in other_predictions]
                        if len(set(other_letters)) == 1:
                            print(f"Two models agree on {other_letters[0]}, but one model has perfect confidence for {perfect_predictions[0][1]}")
                            conf, letter, preds, idx, model_name = perfect_predictions[0]
                            print(f"Using {model_name} model with perfect confidence for letter: {letter}")
                            current_symbol = letter
                            predictions = preds
                            top3_idx = idx
                            model_used = model_name
                        else:
                            conf, letter, preds, idx, model_name = perfect_predictions[0]
                            print(f"Using {model_name} model with perfect confidence for letter: {letter}")
                            current_symbol = letter
                            predictions = preds
                            top3_idx = idx
                            model_used = model_name
                    else:
                        conf, letter, preds, idx, model_name = perfect_predictions[0]
                        print(f"Using {model_name} model with perfect confidence for letter: {letter}")
                        current_symbol = letter
                        predictions = preds
                        top3_idx = idx
                        model_used = model_name
                else:
                    letter_counts = {}
                    for conf, letter, preds, idx, model_name in all_predictions:
                        if letter not in letter_counts:
                            letter_counts[letter] = []
                        letter_counts[letter].append((conf, preds, idx, model_name))
                    
                    majority_letters = {letter: votes for letter, votes in letter_counts.items() if len(votes) >= 2}
                    
                    if majority_letters:
                        best_letter = max(majority_letters.items(), 
                                        key=lambda x: sum(vote[0] for vote in x[1]) / len(x[1]))
                        letter, votes = best_letter
                        conf, preds, idx, model_name = max(votes, key=lambda x: x[0])
                        if conf > 0.8:
                            print(f"Majority vote: {len(votes)} models agree on {letter} (using {model_name} model's prediction)")
                            current_symbol = letter
                            predictions = preds
                            top3_idx = idx
                            model_used = model_name
                        else:
                            return
                    else:
                        all_predictions = []
                        if old_predicted_letter in old_model_letters:
                            all_predictions.append((old_predictions[old_top3_idx[0]], old_predicted_letter, old_predictions, old_top3_idx, 'old'))
                        if best_predicted_letter in best_model_letters:
                            all_predictions.append((best_predictions[best_top3_idx[0]], best_predicted_letter, best_predictions, best_top3_idx, 'best'))
                        if big_predicted_letter in big_model_letters:
                            all_predictions.append((big_predictions[big_top3_idx[0]], big_predicted_letter, big_predictions, big_top3_idx, 'big'))
                        
                        if not all_predictions:
                            return
                        
                        all_predictions.sort(key=lambda x: x[0], reverse=True)
                        conf, letter, preds, idx, model_name = all_predictions[0]
                        if conf > 0.8:
                            print(f"Using {model_name} model (highest confidence) for letter: {letter}")
                            current_symbol = letter
                            predictions = preds
                            top3_idx = idx
                            model_used = model_name
                        else:
                            return

        # Update global variables for use in suggestions
        current_top3_idx = top3_idx
        last_used_model = model_used
        
        # Update previous character and history (EXACT from webtrial2.py)
        prev_char = current_symbol
        count += 1
        ten_prev_char[count % 10] = current_symbol
        if current_symbol not in [" ", "SPACE", "NEXT", ""]:
            last_valid_symbol = current_symbol
        
        # Update suggestions with the correct indices
        update_suggestions(top3_idx)

    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        traceback.print_exc()
        return

def update_suggestions(top3_idx):
    """EXACT update_suggestions function from webtrial2.py"""
    global current_symbol, str_text
    global word1, word2, word3, word4, word1_sug, word2_sug, word3_sug, word4_sug
    
    try:
        # Get letter predictions for suggestions - using the correct class indices based on model used
        if last_used_model == "old":
            suggestions = [list(old_class_indices.keys())[i] for i in top3_idx]
        elif last_used_model == "best":
            suggestions = [list(best_class_indices.keys())[i] for i in top3_idx]
        else:  # big model (default)
            suggestions = [list(big_class_indices.keys())[i] for i in top3_idx]
        
        print(f"Top 3 predictions from {last_used_model} model: {suggestions}")

        # Set initial suggestions as letters (EXACT from webtrial2.py)
        word1 = suggestions[0] if len(suggestions) > 0 else " "
        word2 = suggestions[1] if len(suggestions) > 1 else " "
        
        # Add specific additional suggestions based on current symbol (EXACT from webtrial2.py)
        if current_symbol == "T":
            word3 = "P"  # Set P as third suggestion for T
            word4 = "F"  # Set F as fourth suggestion for T
        elif current_symbol == "B":
            word3 = "W"  # Set W as third suggestion for B
            word4 = suggestions[2] if len(suggestions) > 2 else " "
        else:
            word3 = suggestions[2] if len(suggestions) > 2 else " "
            if current_symbol == "X":
                word4 = "E"
            elif current_symbol == "O":
                word4 = "Q"
            elif current_symbol == "W":
                word4 = "B"
            elif current_symbol == "C":
                word4 = "U"
            else:
                word4 = " "

        # Get word suggestions based on the current sentence (EXACT from webtrial2.py)
        current_sentence = str_text.strip()
        word1_sug = word2_sug = word3_sug = word4_sug = " "
        
        if current_sentence:

            # EXACT logic from webtrial2.py - find words and get last word
            words = current_sentence.split()
            if words:
                last_word = words[-1].upper()  # Get last word in uppercase
                print(f"Current last word: '{last_word}'")
                
                # Generate word suggestions based on current partial word
                word_suggestions = []
                
                # Common English words starting with current letters (EXACT from webtrial2.py)
                common_words = {
                    'A': ['AND', 'ARE', 'ALL', 'ALSO'],
                    'B': ['BUT', 'BE', 'BEEN', 'BECAUSE'],
                    'C': ['CAN', 'COME', 'COULD', 'CALL'],
                    'D': ['DO', 'DID', 'DON\'T', 'DOWN'],
                    'E': ['EACH', 'EVEN', 'EVERY', 'END'],
                    'F': ['FOR', 'FROM', 'FIRST', 'FIND'],
                    'G': ['GET', 'GO', 'GOOD', 'GREAT'],
                    'H': ['HE', 'HER', 'HIM', 'HOW'],
                    'I': ['I', 'IN', 'IS', 'IT'],
                    'J': ['JUST', 'JOB', 'JOIN', 'JUMP'],
                    'K': ['KNOW', 'KEEP', 'KIND', 'KEY'],
                    'L': ['LIKE', 'LOOK', 'LAST', 'LONG'],
                    'M': ['MY', 'ME', 'MORE', 'MAKE'],
                    'N': ['NO', 'NOT', 'NOW', 'NEW'],
                    'O': ['OF', 'ON', 'OR', 'ONE'],
                    'P': ['PEOPLE', 'PLACE', 'PLEASE', 'PUT'],
                    'Q': ['QUESTION', 'QUITE', 'QUICK', 'QUIET'],
                    'R': ['RIGHT', 'REALLY', 'ROOM', 'RUN'],
                    'S': ['SO', 'SHE', 'SEE', 'SOME'],
                    'T': ['THE', 'TO', 'THAT', 'THIS'],
                    'U': ['UP', 'US', 'USE', 'UNDER'],
                    'V': ['VERY', 'VIEW', 'VISIT', 'VOICE'],
                    'W': ['WE', 'WILL', 'WITH', 'WHAT'],
                    'X': ['XBOX', 'XRAY', 'EXTRA', 'EXIT'],
                    'Y': ['YOU', 'YOUR', 'YES', 'YEAR'],
                    'Z': ['ZONE', 'ZERO', 'ZIP', 'ZOO']
                }
                
                # If current word has only 1-2 letters, suggest common words starting with those letters
                if len(last_word) <= 2:
                    first_letter = last_word[0] if last_word else 'A'
                    if first_letter in common_words:
                        # Filter words that start with the current partial word
                        matching_words = [word for word in common_words[first_letter] 
                                        if word.startswith(last_word)]
                        word_suggestions.extend(matching_words[:4])
                else:
                    # For longer words, try pyspellchecker suggestions
                    try:
                        candidates = spell.candidates(last_word.lower())
                        if candidates:
                            # Filter candidates that start with the partial word
                            spell_suggestions = [word.upper() for word in candidates 
                                               if word.upper().startswith(last_word.upper())]
                            word_suggestions.extend(spell_suggestions[:4])
                        
                        # If we still don't have enough suggestions, use common words
                        if len(word_suggestions) < 4:
                            first_letter = last_word[0]
                            if first_letter in common_words:
                                remaining_words = [word for word in common_words[first_letter] 
                                                 if word not in word_suggestions and word.startswith(last_word)]
                                word_suggestions.extend(remaining_words[:4-len(word_suggestions)])
                    except Exception as spell_error:
                        print(f"Spell checker error: {spell_error}")
                        # If spell check fails, use common words starting with first letter
                        first_letter = last_word[0] if last_word else 'A'
                        if first_letter in common_words:
                            word_suggestions = [word for word in common_words[first_letter] 
                                              if word.startswith(last_word)][:4]
                
                # Fill word suggestions
                if word_suggestions:
                    word1_sug = word_suggestions[0] if len(word_suggestions) > 0 else " "
                    word2_sug = word_suggestions[1] if len(word_suggestions) > 1 else " "
                    word3_sug = word_suggestions[2] if len(word_suggestions) > 2 else " "
                    word4_sug = word_suggestions[3] if len(word_suggestions) > 3 else " "
                    print(f"Word suggestions: {word_suggestions}")

        return [word1, word2, word3, word4], [word1_sug, word2_sug, word3_sug, word4_sug]

    except Exception as e:
        print(f"Error in suggestions: {str(e)}")
        return [' ', ' ', ' ', ' '], [' ', ' ', ' ', ' ']

@app.route('/predict', methods=['POST'])
def predict_route():
    """EXACT prediction route with proper timing from webtrial2.py"""
    global current_symbol, prev_char, str_text, count, ten_prev_char, last_next_time, next_gesture_counter, last_valid_symbol
    global last_prediction_time, gesture_start_time, consistent_gesture_count, last_gesture_type, last_appended_symbol
    global word1, word2, word3, word4, word1_sug, word2_sug, word3_sug, word4_sug
    
    try:
        if not request.json or 'image' not in request.json or request.json['image'] is None:
            return jsonify({
                'success': True,
                'current_symbol': current_symbol,
                'suggestions': [word1, word2, word3, word4],
                'word_suggestions': [word1_sug, word2_sug, word3_sug, word4_sug],
                'sentence': str_text,
                'skeletal_image': None
            })
        
        # Get image data from request
        image_data = request.json['image'].split(',')[1]
        img_bytes = base64.b64decode(image_data)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({'success': False, 'error': 'Invalid image data'})
        
        # Flip frame to match webcam mirror view
        frame = cv2.flip(frame, 1)
        
        # Detect hands
        result = hd.findHands(frame, draw=False, flipType=True)
        if isinstance(result, tuple) and len(result) == 2:
            hands, _ = result
        else:
            hands = result  # Handle cases where only one value is returned
        
        # Create white canvas for skeletal image
        white = np.ones((400, 400, 3), dtype=np.uint8) * 255
        cv2.rectangle(white, (0,0), (399,399), (0,0,0), 2)
        
        # EXACT gesture detection logic from webtrial2.py
        now = time.time()
        is_space_gesture = False
        is_next_gesture = False
        
        if hands and len(hands) == 2:
            hand1 = hands[0]
            hand2 = hands[1]
            pts1 = hand1['lmList']
            pts2 = hand2['lmList']
            hand1_open = all(pts1[tip][1] < pts1[pip][1] for tip, pip in [(8,6), (12,10), (16,14), (20,18)])
            hand2_open = all(pts2[tip][1] < pts2[pip][1] for tip, pip in [(8,6), (12,10), (16,14), (20,18)])
            is_space_gesture = hand1_open and hand2_open
            
        elif hands and len(hands) == 1:
            hand = hands[0]
            pts = hand['lmList']
            
            # EXACT NEXT gesture detection from webtrial2.py
            fingers_extended = [
                pts[8][1] < pts[6][1],   # Index finger
                pts[12][1] < pts[10][1], # Middle finger  
                pts[16][1] < pts[14][1], # Ring finger
                pts[20][1] < pts[18][1]  # Pinky finger
            ]
            
            thumb_extended = pts[4][0] > pts[3][0] if hand['type'] == 'Right' else pts[4][0] < pts[3][0]
            all_fingers_extended = all(fingers_extended) and thumb_extended
            
            finger_spread = (
                abs(pts[8][0] - pts[12][0]) > 20 and
                abs(pts[12][0] - pts[16][0]) > 15 and
                abs(pts[16][0] - pts[20][0]) > 10
            )
            
            palm_facing = abs(pts[0][1] - pts[9][1]) > 40
            is_next_gesture = all_fingers_extended and finger_spread and palm_facing

        # IMPROVED gesture handling logic - faster response
        if is_space_gesture:
            current_symbol = "SPACE"
            last_valid_symbol = "SPACE"
            # Reset suggestions for space gesture
            word1 = word2 = word3 = word4 = " "
            word1_sug = word2_sug = word3_sug = word4_sug = " "
        elif is_next_gesture:
            # FASTER timing logic - reduced delay and frame requirement
            if now - last_next_time > 0.8:  # Reduced from 2.0 to 0.8 seconds
                next_gesture_counter += 1
                if next_gesture_counter >= 2:  # Reduced from 5 to 2 consistent frames
                    # Check if the symbol to append is different from the last appended symbol
                    symbol_to_append = last_valid_symbol
                    
                    if symbol_to_append == "SPACE":
                        if not str_text or not str_text[-1].isspace():
                            str_text += " "
                            last_appended_symbol = "SPACE"
                            print(f"NEXT gesture: Added SPACE to sentence. New sentence: '{str_text}'")
                    elif symbol_to_append not in ["", " ", "NEXT"]:
                        # Only append if it's different from the last appended symbol
                        if symbol_to_append != last_appended_symbol:
                            str_text += symbol_to_append
                            last_appended_symbol = symbol_to_append
                            print(f"NEXT gesture: Added '{symbol_to_append}' to sentence. New sentence: '{str_text}'")
                        else:
                            print(f"NEXT gesture: Skipping duplicate '{symbol_to_append}' - already appended")
                    
                    last_next_time = now
                    next_gesture_counter = 0
            current_symbol = "NEXT"
        else:
            next_gesture_counter = 0
            # Only update current_symbol if we're not in a next gesture state
            if now - last_next_time > 0.8:  # Also reduced here
                if hands:
                    # ... rest of your existing skeletal drawing logic ...
                    if len(hands) == 2:
                        bboxes = []
                        hands.sort(key=lambda x: x['bbox'][0])

                        for hand in hands:
                            bboxes.append(hand['bbox'])

                        x = max(0, min(b[0] for b in bboxes) - offset)
                        y = max(0, min(b[1] for b in bboxes) - offset)
                        w = min(frame.shape[1] - x, max(b[0] + b[2] for b in bboxes) - x + 2*offset)
                        h = min(frame.shape[0] - y, max(b[1] + b[3] for b in bboxes) - y + 2*offset)

                        scale = min(350/w, 350/h)
                        os = (400 - int(w * scale)) // 2
                        os1 = (400 - int(h * scale)) // 2

                        for hand in hands:
                            for lm in hand['lmList']:
                                cx = int((lm[0] - x) * scale) + os
                                cy = int((lm[1] - y) * scale) + os1
                                cv2.circle(white, (cx, cy), 5, (0, 255, 0), cv2.FILLED)

                            connections = [
                                [0,1,2,3,4], [0,5,6,7,8], [0,9,10,11,12],
                                [0,13,14,15,16], [0,17,18,19,20]
                            ]

                            for connection in connections:
                                for i in range(len(connection)-1):
                                    pt1 = hand['lmList'][connection[i]]
                                    pt2 = hand['lmList'][connection[i+1]]
                                    x1 = int((pt1[0] - x) * scale) + os
                                    y1 = int((pt1[1] - y) * scale) + os1
                                    x2 = int((pt2[0] - x) * scale) + os
                                    y2 = int((pt2[1] - y) * scale) + os1
                                    cv2.line(white, (x1, y1), (x2, y2), (0,255,0), 2)

                            palm_connections = [[0,5], [5,9], [9,13], [13,17], [0,17]]
                            for start, end in palm_connections:
                                pt1 = hand['lmList'][start]
                                pt2 = hand['lmList'][end]
                                x1 = int((pt1[0] - x) * scale) + os
                                y1 = int((pt1[1] - y) * scale) + os1
                                x2 = int((pt2[0] - x) * scale) + os
                                y2 = int((pt2[1] - y) * scale) + os1
                                cv2.line(white, (x1, y1), (x2, y2), (0,255,0), 2)

                    else:  # Single hand
                        hand = hands[0]
                        x, y, w, h = hand['bbox']
                        x = max(0, x - offset)
                        y = max(0, y - offset)
                        w = min(frame.shape[1] - x, w + 2*offset)
                        h = min(frame.shape[0] - y, h + 2*offset)

                        scale = min(350/w, 350/h)
                        os = (400 - int(w * scale)) // 2
                        os1 = (400 - int(h * scale)) // 2

                        connections = [
                            [0,1,2,3,4], [0,5,6,7,8], [0,9,10,11,12],
                            [0,13,14,15,16], [0,17,18,19,20]
                        ]

                        for connection in connections:
                            for i in range(len(connection)-1):
                                pt1 = hand['lmList'][connection[i]]
                                pt2 = hand['lmList'][connection[i+1]]
                                x1 = int((pt1[0] - x) * scale) + os
                                y1 = int((pt1[1] - y) * scale) + os1
                                x2 = int((pt2[0] - x) * scale) + os
                                y2 = int((pt2[1] - y) * scale) + os1
                                cv2.line(white, (x1, y1), (x2, y2), (0,255,0), 2)

                        palm_connections = [[0,5], [5,9], [9,13], [13,17], [0,17]]
                        for start, end in palm_connections:
                            pt1 = hand['lmList'][start]
                            pt2 = hand['lmList'][end]
                            x1 = int((pt1[0] - x) * scale) + os
                            y1 = int((pt1[1] - y) * scale) + os1
                            x2 = int((pt2[0] - x) * scale) + os
                            y2 = int((pt2[1] - y) * scale) + os1
                            cv2.line(white, (x1, y1), (x2, y2), (0,255,0), 2)

                        for lm in hand['lmList']:
                            cx = int((lm[0] - x) * scale) + os
                            cy = int((lm[1] - y) * scale) + os1
                            cv2.circle(white, (cx, cy), 1, (0,0,255), 1)

                    # Make prediction with timing control
                    current_time = time.time()
                    if current_time - last_prediction_time > 0.1:  # Limit predictions to 10 FPS
                        predict(white, hands)
                        last_prediction_time = current_time
                    
                    # Reset last_appended_symbol when a new letter is detected
                    if current_symbol not in ["", " ", "SPACE", "NEXT"] and current_symbol != last_appended_symbol:
                        last_appended_symbol = ""  # Reset to allow new letter to be appended
                        
                    if current_symbol not in ["", " ", "SPACE", "NEXT"]:
                        last_valid_symbol = current_symbol

        # Get suggestions - use the global variables that are updated in predict()
        suggestions = [word1, word2, word3, word4]
        word_suggestions = [word1_sug, word2_sug, word3_sug, word4_sug]
        
        # Convert skeletal image to base64
        _, buffer = cv2.imencode('.jpg', white, [cv2.IMWRITE_JPEG_QUALITY, 80])
        skeletal_image_data = base64.b64encode(buffer).decode('utf-8')
        
        # Determine display symbol
        display_symbol = "SPACE" if is_space_gesture else ("NEXT" if is_next_gesture else last_valid_symbol)
        
        return jsonify({
            'success': True,
            'current_symbol': display_symbol,
            'suggestions': suggestions,
            'word_suggestions': word_suggestions,
            'sentence': str_text,
            'skeletal_image': f'data:image/jpeg;base64,{skeletal_image_data}'
        })
    
    except Exception as e:
        print(f"Error in prediction: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/update_sentence', methods=['POST'])
def update_sentence():
    global str_text
    try:
        data = request.json
        str_text = data.get('text', ' ')
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/speak', methods=['POST'])
def speak():
    try:
        data = request.json
        text_to_speak = data.get('text', '')
        if text_to_speak and speak_engine:
            speak_engine.say(text_to_speak)
            speak_engine.runAndWait()
            return jsonify({'status': 'success'}), 200
        return jsonify({'status': 'error', 'message': 'No text provided or TTS not available'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/add_suggestion', methods=['POST'])
def add_suggestion():
    """Add letter suggestion to sentence"""
    global str_text
    try:
        data = request.json
        suggestion = data.get('suggestion', '')
        if suggestion and suggestion.strip() != " ":
            # Simply append the letter to the current sentence
            str_text += suggestion
            print(f"Added letter suggestion: '{suggestion}', new sentence: '{str_text}'")
            return jsonify({'success': True, 'sentence': str_text})
        return jsonify({'success': False, 'error': 'Invalid suggestion'})
    except Exception as e:
        print(f"Error adding suggestion: {e}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/add_word_suggestion', methods=['POST'])
def add_word_suggestion():
    """Replace current incomplete word with word suggestion - EXACT from webtrial2.py"""
    global str_text, current_symbol, prev_char, count, ten_prev_char, last_valid_symbol, last_appended_symbol
    try:
        data = request.json
        word = data.get('word', '')
        if word and word.strip() != " ":
            current_sentence = str_text.strip()
            if current_sentence:
                words = current_sentence.split()
                if words:
                    # Replace the last word with the new word (EXACT logic from webtrial2.py)
                    words[-1] = word.upper()
                    str_text = " ".join(words) + " "
                else:
                    # If no words, just add the new word
                    str_text = word.upper() + " "
            else:
                # If sentence is empty, just add the new word
                str_text = word.upper() + " "
            
            # Clear letter backlog when word suggestion is used
            current_symbol = "C"
            prev_char = " "
            count = -1
            ten_prev_char = [" "] * 10
            last_valid_symbol = ""
            last_appended_symbol = ""
            
            print(f"Replaced current word with: {word}, new sentence: '{str_text}', cleared letter backlog")
            return jsonify({'success': True, 'sentence': str_text})
        return jsonify({'success': False, 'error': 'Invalid word'})
    except Exception as e:
        print(f"Error adding word suggestion: {e}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/clear_sentence', methods=['POST'])
def clear_sentence():
    """Clear the current sentence"""
    global str_text
    try:
        str_text = " "
        print("Sentence cleared")
        return jsonify({'success': True, 'sentence': str_text})
    except Exception as e:
        print(f"Error clearing sentence: {e}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/delete_last_char', methods=['POST'])
def delete_last_char():
    """Delete the last character from sentence"""
    global str_text
    try:
        if len(str_text) > 1:  # Keep at least one space
            str_text = str_text[:-1]
        print(f"Deleted last character, new sentence: '{str_text}'")
        return jsonify({'success': True, 'sentence': str_text})
    except Exception as e:
        print(f"Error deleting character: {e}")
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    print("Starting Flask server with exact webtrial2.py logic...")
    app.run(debug=True, threaded=True, port=5000)