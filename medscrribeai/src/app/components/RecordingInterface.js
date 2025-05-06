'use client';
import { useState, useRef, useEffect } from 'react';

export default function RecordingInterface({ recording, onComplete, onCancel }) {
  const [isRecording, setIsRecording] = useState(recording);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  useEffect(() => {
    setIsRecording(recording);
    
    if (recording) {
      startRecording();
    }
  }, [recording]);
  
  useEffect(() => {
    let interval = null;
    
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds(prevSeconds => {
          if (prevSeconds >= 30) {
            stopRecording();
            return 30;
          }
          return prevSeconds + 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        onComplete(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setSeconds(0);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };
  
  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-md">
      <div className="text-center mb-4">
        <div className="text-2xl font-bold mb-2">
          {isRecording ? 'Recording...' : 'Recording Complete'}
        </div>
        <div className="text-xl mb-4">
          {isRecording ? `${30 - seconds} seconds remaining` : 'Processing recording...'}
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        {isRecording ? (
          <button 
            className="bg-red-500 text-white px-6 py-2 rounded-lg"
            onClick={stopRecording}
          >
            Stop Recording
          </button>
        ) : (
          <button 
            className="bg-blue-500 text-white px-6 py-2 rounded-lg"
            onClick={startRecording}
          >
            Record Again
          </button>
        )}
        
        <button 
          className="bg-gray-500 text-white px-6 py-2 rounded-lg"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}