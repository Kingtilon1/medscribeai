const API_BASE_URL = 'http://localhost:8000/api';
export async function createDocumentationSession(visitId) {
  const formData = new FormData();
  formData.append('visit_id', visitId);
  
  const response = await fetch(`${API_BASE_URL}/documentation/sessions`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }
  
  return await response.json();
}

export async function processDocumentation(formData) {
  const response = await fetch(`${API_BASE_URL}/documentation/process`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error(`Failed to process documentation: ${response.statusText}`);
  }
  
  return await response.json();
}