# main.py
import uvicorn
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import os
from contextlib import asynccontextmanager
import aioodbc
import datetime

from services.agent_service import AgentService
from services.database_service import DatabaseService

@asynccontextmanager
async def lifespan(app: FastAPI):
    global agent_service, database_service
    agent_service = await AgentService.get_instance()
    database_service = DatabaseService.get_instance()
    yield
    await agent_service.cleanup()
    
app = FastAPI(lifespan=lifespan, title="Medical Documentation System API")

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/api/patients")
async def get_patients():
    try:
        # Add timeout and retry logic
        for attempt in range(3):
            try:
                patients = await asyncio.wait_for(
                    database_service.get_all_patients(),
                    timeout=5.0  # 5 second timeout
                )
                return {"patients": patients}
            except asyncio.TimeoutError:
                if attempt == 2:  # Last attempt
                    raise
                await asyncio.sleep(1)  # Wait before retry
    except Exception as e:
        print(f"Error fetching patients: {e}")
        return {"error": str(e)}
    
@app.post("/api/visits")
async def create_visit(
    patient_id: int = Body(...),
    visit_type: str = Body(...),
    reason_for_visit: str = Body(...),
    visit_date: str = Body(...),
    status: str = Body(...),
    provider_id: int = Body(1)
):
    formatted_date = datetime.datetime.fromisoformat(visit_date)
    try:
        visit_id = await database_service.create_visit(
            patient_id, provider_id, formatted_date, visit_type, status, reason_for_visit
        )
        print(f"Visit created with ID: {visit_id}, type: {type(visit_id)}")
        return {"visit_id": visit_id, "message": "Visit created successfully"}
    except Exception as e:
        print(f"Error in create_visit: {str(e)}")
        raise

@app.get("/api/visits/{visit_id}")
async def get_visit(visit_id: int):
    visit = await database_service.get_visit(visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return visit

@app.get("/api/visits")
async def get_all_visits():
    async with database_service.get_connection() as conn:
        async with conn.cursor() as cursor:
            query = """
            SELECT v.*, p.FirstName, p.LastName 
            FROM Visits v JOIN Patients p ON v.PatientID = p.PatientID 
            ORDER BY v.VisitDate DESC
            """
            await cursor.execute(query)
            columns = [column[0] for column in cursor.description]
            rows = await cursor.fetchall()
            return [dict(zip(columns, row)) for row in rows]
        
@app.post("/api/patients")
async def create_patient(
    first_name: str = Body(...),
    last_name: str = Body(...),
    dob: str = Body(...),  # Format: YYYY-MM-DD
    gender: str = Body(None),
    address: str = Body(None),
    phone: str = Body(None),
    email: str = Body(None),
    insurance_provider: str = Body(None),
    insurance_number: str = Body(None)
):
    try:
        patient_id = await database_service.create_patient(
            first_name, last_name, dob, gender, address, phone, 
            email, insurance_provider, insurance_number
        )
        return {"patient_id": patient_id, "message": "Patient created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create patient: {str(e)}")

@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: int):
    return await database_service.get_patient(patient_id)

@app.get("/api/providers/{provider_id}/visits")
async def get_provider_visits(provider_id: int):
    return await database_service.get_active_visits(provider_id)

@app.post("/api/documentation/sessions")
async def create_documentation_session(visit_id: int = Form(...)):
    thread_id = await agent_service.create_documentation_session(visit_id)
    return {"thread_id": thread_id}

@app.post("/api/documentation/process")
async def process_documentation(
    thread_id: str = Form(...),
    visit_id: int = Form(...),
    audio: UploadFile = File(None),
    transcript: str = Form(None)
):
    print(f"Backend received process request - thread_id: {thread_id}, visit_id: {visit_id}")
    print(f"Audio file: {audio.filename if audio else 'None'}, Transcript: {transcript}")
    if not audio and not transcript:
        raise HTTPException(400, "Either audio file or transcript must be provided")
    
    # If audio provided, save temporarily
    audio_path = None
    if audio:
        os.makedirs("temp", exist_ok=True)
        audio_path = f"temp/{audio.filename}"
        with open(audio_path, "wb") as f:
            content = await audio.read()
            f.write(content)
    
    try:
        # Process with our agent service
        print(f"Processing request with thread_id: {thread_id}, visit_id: {visit_id}")
        responses = await agent_service.process_conversation(
            thread_id=thread_id,
            visit_id=visit_id,
            audio_file=audio_path,
            transcript=transcript
        )
        print(f"Agent responses: {responses}")
        return {"responses": responses}
    except Exception as e:
        print(f"Error processing documentation: {e}")
        raise
    finally:
        # Clean up temporary files
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
            
@app.post("/api/documentation/save-transcript")
async def save_transcript(
    visit_id: int = Form(...),
    transcript_text: str = Form(...)
):
    try:
        print(f"Saving transcript for visit_id: {visit_id}, length: {len(transcript_text)} chars")
        transcript_id = await database_service.save_transcript(visit_id, transcript_text)
        print(f"Saved transcript with ID: {transcript_id}")
        return {"transcript_id": transcript_id, "message": "Transcript saved successfully"}
    except Exception as e:
        import traceback
        print(f"Error saving transcript: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to save transcript: {str(e)}")

@app.post("/api/documentation/save-soap")
async def save_soap_note(
    visit_id: int = Form(...),
    subjective: str = Form(...),
    objective: str = Form(...),
    assessment: str = Form(...),
    treatment_plan: str = Form(...)
):
    try:
        note_id = await database_service.save_soap_note(
            visit_id, subjective, objective, assessment, treatment_plan
        )
        return {"note_id": note_id, "message": "SOAP note saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save SOAP note: {str(e)}")


@app.post("/api/visits/{visit_id}/update")
async def update_visit(
    visit_id: int,
    patient_id: str = Form(...),  # Keep as string to match form data
    visit_date: str = Form(...),
    visit_type: str = Form(...),
    reason: str = Form(...),
    status: str = Form(...),
    provider_id: str = Form("1")  # Default to 1 if not provided
):
    try:
        # Convert string to int for IDs
        patient_id_int = int(patient_id)
        provider_id_int = int(provider_id)
        
        # Format date if needed
        formatted_date = visit_date
        if "T" in visit_date:  # If in ISO format
            formatted_date = visit_date.split("T")[0]
            
        await database_service.update_visit(
            visit_id, patient_id_int, provider_id_int, 
            formatted_date, visit_type, status, reason
        )
        return {"message": "Visit updated successfully"}
    except Exception as e:
        print(f"Error updating visit: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update visit: {str(e)}")
    
@app.post("/api/visits/{visit_id}/update-status")
async def update_visit_status(
    visit_id: int,
    status: str = Form(...)
):
    try:
        await database_service.update_visit_status(visit_id, status)
        return {"message": f"Visit status updated to {status}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update visit status: {str(e)}")
    
@app.get("/api/documentation/transcript/{visit_id}")
async def get_transcript(visit_id: int):
    try:
        transcript = await database_service.get_transcript_for_visit(visit_id)
        if transcript:
            return transcript
        else:
            raise HTTPException(status_code=404, detail="No transcript found for this visit")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch transcript: {str(e)}")

@app.get("/api/documentation/soap/{visit_id}")
async def get_soap_note(visit_id: int):
    try:
        soap_note = await database_service.get_soap_note_for_visit(visit_id)
        if soap_note:
            return soap_note
        else:
            raise HTTPException(status_code=404, detail="No SOAP note found for this visit")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch SOAP note: {str(e)}")
    
    

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)