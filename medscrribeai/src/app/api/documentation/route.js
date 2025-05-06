const API_BASE_URL = 'http://localhost:8000/api';

export async function fetchPatients() {
  const timestamp = Date.now();
  const response = await fetch(`${API_BASE_URL}/patients?t=${timestamp}`);
  if (!response.ok) {
    console.log('couildnt get patients')
    throw new Error(`Failed to fetch patients: ${response.statusText}`);
  }
  const data  =  await response.json();
  return data.patients;
}

export async function fetchActiveVisits(providerId) {
  const response = await fetch(`${API_BASE_URL}/providers/${providerId}/visits`);
  if (!response.ok) {
    throw new Error(`Failed to fetch visits: ${response.statusText}`);
  }
  return await response.json();
}

export async function fetchVisit(visitId) {
  const response = await fetch(`${API_BASE_URL}/visits/${visitId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch visit: ${response.statusText}`);
  }
  return await response.json();
}

