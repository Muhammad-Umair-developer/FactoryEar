import os
import shutil
import traceback
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.inference import inference_service
from app.services.inference_phase2 import tool_inference_service

router = APIRouter()

# 1. Phase 1 Endpoint (Pump)
@router.post("/analyze")
async def analyze_machine_audio(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".wav"):
        raise HTTPException(status_code=400, detail="Invalid file type. Ensure the file ends in .wav")
    
    temp_file_path = f"temp_phase1_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        results = inference_service.analyze_audio(temp_file_path)
        
        return {
            "filename": file.filename,
            "status": "success",
            "analysis": results
        }
    except Exception as e:
        # Pushes the exact Python error to the API response instead of returning null
        raise HTTPException(status_code=500, detail=f"Phase 1 Internal Error: {str(e)}\n{traceback.format_exc()}")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

# 2. Phase 2 Endpoint (Tool Wear)
@router.post("/analyze-tool")
async def analyze_tool_audio(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".wav"):
        raise HTTPException(status_code=400, detail="Invalid file type. Ensure the file ends in .wav")
    
    temp_file_path = f"temp_phase2_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        results = tool_inference_service.analyze_tool_audio(temp_file_path)
        
        return {
            "filename": file.filename,
            "status": "success",
            "analysis": results
        }
    except Exception as e:
        # Pushes the exact Python error to the API response instead of returning null
        raise HTTPException(status_code=500, detail=f"Phase 2 Internal Error: {str(e)}\n{traceback.format_exc()}")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)