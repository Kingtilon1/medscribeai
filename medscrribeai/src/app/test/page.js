'use client'
import { useEffect } from 'react';

const TestConnection = () => {
  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch('http://localhost:8000/test');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Test connection successful:', data);
      } catch (error) {
        console.error('Error connecting to FastAPI:', error);
      }
    };
    
    testAPI();
  }, []);

  return (
    <div>
      <h1>Testing Connection with FastAPI</h1>
    </div>
  );
};

export default TestConnection;
