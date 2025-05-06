# MedScribeAI: AI-Powered Medical Documentation Assistant

MedScribeAI is a sophisticated full-stack application designed to revolutionize medical documentation by leveraging AI to transcribe doctor-patient interactions and generate structured clinical notes. This tool helps healthcare providers spend less time on paperwork and more time on patient care.

## 🔍 Overview

This AI assistant streamlines the medical documentation process by automatically converting conversations into professional SOAP notes and other clinical documentation, saving healthcare providers valuable time while improving documentation quality.

## ✨ Key Features

- **Voice-to-Text Transcription**: Captures doctor-patient conversations in real-time
- **AI-Powered Documentation**: Generates structured SOAP notes from transcripts
- **Patient Management**: Create and manage patient records
- **Visit Tracking**: Document and track patient visits
- **Provider Integration**: Assign visits to healthcare providers
- **Secure Authentication**: Role-based access for healthcare staff

## 🧰 Technology Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **Azure SQL**: Secure database for patient and clinical data
- **Azure AI Services**: Powers transcription and language understanding
- **Semantic Kernel**: Agent orchestration for AI workflows

### Frontend
- **Next.js**: React framework for user interface
- **TailwindCSS**: Utility-first CSS for styling
- **React Components**: Modern UI elements for healthcare workflows
- **WebRTC**: Powers real-time audio capture

## 🚀 Installation & Setup

1. Clone the repository
2. Install dependencies:
pip install -r requirements.txt
npm install
3. Configure Azure services (see configuration guide)
4. Start the backend:
uvicorn main --reload
5. Start the frontend:
npm run dev

## 📝 Usage

1. Login with provider credentials
2. Select or create a patient record
3. Start a new visit
4. Begin recording the doctor-patient conversation
5. Review and edit the generated documentation
6. Save to the patient's record

## 🧠 AI Components

- **Transcription Agent**: Converts speech to accurate text
- **Documentation Agent**: Transforms transcripts into structured SOAP notes
- **Verification Agent**: Reviews and validates documentation quality

## 🤝 Contributing

Contributions welcome! Please read our contribution guidelines before submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔒 Privacy & Compliance

MedScribeAI is designed with HIPAA compliance in mind. Please consult with your compliance team before deploying in a clinical setting.
