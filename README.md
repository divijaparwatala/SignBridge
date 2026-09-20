# SignBridge

SignBridge is an AI-powered full-stack web application that bridges the communication gap between the deaf and hearing communities through **Indian Sign Language (ISL)**. The platform combines **Computer Vision**, **Deep Learning**, and **Multilingual Translation** to provide real-time ISL gesture recognition, text-to-sign translation, speech synthesis, and interactive learning resources. Designed with accessibility in mind, SignBridge serves as both a communication tool and an educational platform for learning Indian Sign Language.

---

## Features

- **Real-Time ISL Gesture Recognition:** Detect and recognize ISL alphabet gestures using a webcam, converting sequential hand gestures into readable text in real time.
- **Text-to-Sign Translation:** Translate text into corresponding ISL sign videos, enabling visual communication for deaf and hard-of-hearing users.
- **Text-to-Speech:** Convert recognized or translated text into natural speech for enhanced accessibility.
- **Interactive ISL Learning Cards:** Learn Indian Sign Language through visually engaging learning cards organized into easy-to-understand categories.
- **Multilingual Sign Dictionary:** Search words in multiple languages and instantly view their corresponding ISL signs, making the platform accessible to a wider audience.
- **Media-Based Learning:** Improve sign language proficiency through educational videos and visual learning resources.
- **Modern Responsive Interface:** Intuitive React-based user interface optimized for seamless navigation across devices.

---

## Workflow

- Users can choose to learn ISL, translate text into sign language, or perform real-time gesture recognition.
- Webcam frames are captured through the React frontend and sent to the Python backend.
- The Flask backend processes each frame using **TensorFlow**, **OpenCV**, and **CVZone** to recognize ISL alphabet gestures.
- Recognized gestures are converted into text and displayed to the user.
- Text translation requests are handled by the Node.js backend, which retrieves the corresponding ISL sign videos and multilingual translations.
- The application can generate speech output using the integrated Text-to-Speech module for improved accessibility.

---

## Tech Stack

### Frontend
- React.js
- Material UI
- React Router
- React Webcam
- Axios

### Backend
- Node.js
- Express.js
- Flask

### AI & Computer Vision
- Python
- TensorFlow
- OpenCV
- Keras
- MediaPipe

---

## Project Structure

```text
SignBridge/
├── Cards/
│   ├── backend/
│   ├── public/
│   └── src/
│
├── StoT/
│   └── backend/
│       ├── models/
│       └── python/
│
└── README.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/<your-username>/SignBridge.git
cd SignBridge
```

### Frontend

```bash
cd Cards
npm install
npm start
```

### Node.js Backend

```bash
cd Cards/backend
npm install
node server.js
```

### Python Backend

```bash
cd StoT/backend/python
pip install -r requirements.txt
python app.py
```

---

## Required Assets

Large assets such as trained TensorFlow models, ISL video datasets, and media files are excluded from version control using `.gitignore`.

To run the project locally, place the required assets in:

```text
Cards/public/isl_videos/
Cards/public/train1/
StoT/backend/models/
```

---

## Future Enhancements

- Continuous sentence-level ISL recognition.
- Personalized learning modules with quizzes and progress tracking.
- Support for additional regional sign languages.
- Mobile application support.
- AI-assisted learning recommendations.

---

## License

This project is licensed under the **MIT License**.
