import cv2
import numpy as np
import json
import sys
import os
from cvzone.HandTrackingModule import HandDetector
from keras.models import load_model
import pyttsx3

# Check if running in socket mode
SOCKET_MODE = '--socket' in sys.argv

# Initialize hand detector
hd = HandDetector(maxHands=2, detectionCon=0.5, minTrackCon=0.5)
offset = 29

# Load models
try:
    old_model = load_model('isl_model_v2.h5')
    with open('class_indices.json', 'r') as f:
        old_class_indices = json.load(f)
    
    best_model = load_model('best_skeletal_model.h5')
    with open('skeletal_class_indices.json', 'r') as f:
        best_class_indices = json.load(f)
    
    big_model = load_model('big_skeletal_model.h5')
    with open('skeletal_class_indices2.json', 'r') as f:
        big_class_indices = json.load(f)
except Exception as e:
    print(json.dumps({'error': str(e)}))
    sys.exit(1)

# Initialize text-to-speech engine
speak_engine = pyttsx3.init()
speak_engine.setProperty("rate", 100)
voices = speak_engine.getProperty("voices")
speak_engine.setProperty("voice", voices[0].id)

# Global variables
current_symbol = " "
current_text = " "
suggestions = [" ", " ", " ", " "]
prev_char = ""
ten_prev_char = [" "] * 10
count = -1

def send_update(type, data):
    if SOCKET_MODE:
        print(json.dumps({'type': type, **data}))
    else:
        print(f"{type}: {data}")

def predict(test_image, hands):
    global current_symbol, current_text, suggestions, prev_char, ten_prev_char, count
    
    try:
        # Resize images for each model
        old_input = cv2.resize(test_image, (256, 256))
        old_input = old_input.astype(np.float32) / 255.0
        
        best_input = cv2.resize(test_image, (224, 224))
        best_input = best_input.astype(np.float32) / 255.0
        
        big_input = cv2.resize(test_image, (256, 256))
        big_input = big_input.astype(np.float32) / 255.0
        
        # Get predictions
        old_predictions = old_model.predict(old_input.reshape(1, 256, 256, 3), verbose=0)[0]
        best_predictions = best_model.predict(best_input.reshape(1, 224, 224, 3), verbose=0)[0]
        big_predictions = big_model.predict(big_input.reshape(1, 256, 256, 3), verbose=0)[0]
        
        # Get top predictions
        old_top3_idx = np.argsort(old_predictions)[-3:][::-1]
        best_top3_idx = np.argsort(best_predictions)[-3:][::-1]
        big_top3_idx = np.argsort(big_predictions)[-3:][::-1]
        
        old_predicted_letter = list(old_class_indices.keys())[old_top3_idx[0]]
        best_predicted_letter = list(best_class_indices.keys())[best_top3_idx[0]]
        big_predicted_letter = list(big_class_indices.keys())[big_top3_idx[0]]
        
        # Update current symbol and suggestions
        current_symbol = best_predicted_letter
        suggestions = [
            best_predicted_letter,
            old_predicted_letter,
            big_predicted_letter,
            " "
        ]
        
        # Update character history
        prev_char = current_symbol
        count += 1
        ten_prev_char[count % 10] = current_symbol
        
        # Send updates
        send_update('symbol', {
            'symbol': current_symbol,
            'suggestions': suggestions
        })
        
        # If we have a complete word, send it
        if current_symbol == " " and prev_char != " ":
            send_update('word', {'text': current_text})
            current_text = ""
        elif current_symbol != " ":
            current_text += current_symbol
            
    except Exception as e:
        send_update('error', {'message': str(e)})

def main():
    cap = cv2.VideoCapture(0)
    
    while True:
        success, frame = cap.read()
        if not success:
            break
            
        frame = cv2.flip(frame, 1)
        hands, _ = hd.findHands(frame, draw=False, flipType=True)
        
        if hands:
            # Create white canvas
            white = np.ones((400, 400, 3), dtype=np.uint8) * 255
            cv2.rectangle(white, (0,0), (399,399), (0,0,0), 2)
            
            if len(hands) == 2:
                # Handle both hands
                bboxes = []
                combined_landmarks = []
                hands.sort(key=lambda x: x['bbox'][0])
                
                for hand in hands:
                    bboxes.append(hand['bbox'])
                    combined_landmarks.extend(hand['lmList'])
                
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
            else:
                # Single hand
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
            
            # Resize for prediction
            res = cv2.resize(white, (256, 256))
            predict(res, hands)
            
            # Send frame update
            if SOCKET_MODE:
                _, buffer = cv2.imencode('.jpg', white)
                send_update('frame', {'frame': buffer.tobytes().hex()})
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main() 