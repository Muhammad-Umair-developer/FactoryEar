import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.inference import inference_service

router = APIRouter()

@router.post("/analyze")
async def analyze_machine_audio(file: UploadFile = File(...)):
    if not file.filename.endswith(".wav"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .wav is supported.")
    
    # Temporarily save the uploaded file for Librosa to process
    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Run the CNN inference
        results = inference_service.analyze_audio(temp_file_path)
        
        return {
            "filename": file.filename,
            "status": "success",
            "analysis": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Ensure cleanup of the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)