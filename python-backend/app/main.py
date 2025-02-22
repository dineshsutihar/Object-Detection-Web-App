import os
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
import base64

from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Form 
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import logging
from ultralytics import YOLO
from dotenv import load_dotenv

from . import db 
from .models import DetectionResult, DetectionResponse, TrainUploadResponse, DetectionLogEntry, TrainingLogEntry # Import models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads/training_images"))
YOLO_MODEL_NAME = os.getenv("YOLO_MODEL", "yolov8n.pt")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="YOLO Detection and Training API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Production Frontend URL will be added later todo:
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)


try:
    logger.info(f"Loading YOLO model: {YOLO_MODEL_NAME}")
    model = YOLO(YOLO_MODEL_NAME)
    logger.info("YOLO model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load YOLO model '{YOLO_MODEL_NAME}': {e}")
    model = None 


def process_yolo_results(results) -> List[Dict[str, Any]]:
    """Formats YOLO results into a JSON-serializable list."""
    detections = []
    if results and results[0].boxes is not None:
        boxes = results[0].boxes.xyxyn.cpu().numpy()
        scores = results[0].boxes.conf.cpu().numpy()
        classes = results[0].boxes.cls.cpu().numpy().astype(int)
        class_names = results[0].names

        for i in range(len(boxes)):
            detections.append(DetectionResult(
                bbox_normalized=tuple(boxes[i].tolist()), 
                class_id=int(classes[i]),
                class_name=class_names.get(classes[i], "Unknown"),
                confidence=float(scores[i]),
            ))
    return detections

@app.post("/detect", response_model=DetectionResponse)
async def detect_objects_upload(request: Request, file: UploadFile = File(...)):
    if model is None: raise HTTPException(status_code=503, detail="YOLO model not available.")
    if not file.content_type.startswith("image/"): raise HTTPException(status_code=400, detail="Invalid file type.")

    detections = []
    log_entry = None
    try:
        logger.info(f"Received file '{file.filename}' for detection.")
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")

        logger.info("Running YOLO detection...")
        results = model(img)
        logger.info("Detection complete.")
        detections = process_yolo_results(results)
        logger.info(f"Found {len(detections)} objects in '{file.filename}'.")

        log_entry = DetectionLogEntry(
            source_type="upload",
            source_filename=file.filename,
            detections=detections,
            status="success"
        )
        await db.log_event(log_entry.dict())

        return DetectionResponse(success=True, filename=file.filename, detections=detections)

    except Exception as e:
        logger.error(f"Error during detection for file '{file.filename}': {e}", exc_info=True)
        log_entry = DetectionLogEntry(
            source_type="upload",
            source_filename=file.filename,
            status="failure",
        )
        await db.log_event(log_entry.dict())
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
    finally:
        if file: await file.close()

@app.post("/detect-frame", response_model=DetectionResponse)
async def detect_objects_frame(request: Request, image_data: str = Form(...)): # Receive base64 string
    """Detects objects in a single image frame (sent as base64 string)."""
    if model is None: raise HTTPException(status_code=503, detail="YOLO model not available.")

    detections = []
    log_entry = None
    try:
        logger.debug("Received frame for detection.") 
        try:
            missing_padding = len(image_data) % 4
            if missing_padding:
                image_data += '='* (4 - missing_padding)
            image_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except (base64.binascii.Error, IOError) as decode_err:
             logger.error(f"Failed to decode/open base64 image: {decode_err}")
             raise HTTPException(status_code=400, detail="Invalid image data format.")

        logger.debug("Running YOLO detection on frame...")
        results = model(img)
        detections = process_yolo_results(results)
        logger.debug(f"Found {len(detections)} objects in frame.")

        
        if detections: 
            log_entry = DetectionLogEntry(
                source_type="live_frame",
                detections=detections,
                status="success"
            )
            await db.log_event(log_entry.dict())

        return DetectionResponse(success=True, detections=detections)

    except Exception as e:
        logger.error(f"Error during frame detection: {e}", exc_info=True)
         # Log failure event
        log_entry = DetectionLogEntry(
            source_type="live_frame",
            status="failure",
        )
        await db.log_event(log_entry.dict())
        raise HTTPException(status_code=500, detail=f"Frame detection failed: {str(e)}")


@app.post("/upload-train", response_model=TrainUploadResponse)
async def upload_training_images(
    request: Request,
    label: str = Form(...), # Get label from form data
    files: List[UploadFile] = File(...)
):
    saved_files_info = []
    errors = []
    original_filenames = []
    relative_paths = []
    logger.info(f"Received {len(files)} file(s) for training upload with label: '{label}'.")

    label_dir = UPLOAD_DIR / label.strip().replace(" ", "_") 
    label_dir.mkdir(parents=True, exist_ok=True)

    for file in files:
        original_filenames.append(file.filename)
        if not file.content_type.startswith("image/"):
            errors.append({"filename": file.filename, "error": "Invalid file type."})
            logger.warning(f"Skipping non-image file: {file.filename}")
            continue

        try:
            unique_id = uuid.uuid4()
            file_extension = Path(file.filename).suffix if file.filename else '.jpg'
            safe_filename = f"{unique_id}{file_extension}"
            save_path = label_dir / safe_filename
            relative_path = save_path.relative_to(UPLOAD_DIR.parent) 
            with open(save_path, "wb") as buffer:
                while content := await file.read(1024 * 1024):
                     buffer.write(content)

            saved_files_info.append({"original": file.filename, "saved": str(save_path)})
            relative_paths.append(str(relative_path)) 
            logger.info(f"Successfully saved training image '{file.filename}' to '{save_path}'")

        except Exception as e:
            logger.error(f"Error saving file '{file.filename}': {e}", exc_info=True)
            errors.append({"filename": file.filename, "error": str(e)})
        finally:
            await file.close()

    log_status = "success" if saved_files_info else "failure"
    if errors and saved_files_info:
         log_status = "partial_success"

    log_entry = TrainingLogEntry(
        label=label,
        uploaded_filenames=original_filenames,
        saved_relative_paths=relative_paths,
        file_count=len(saved_files_info),
        status=log_status
    )
    await db.log_event(log_entry.dict())


    if not saved_files_info and errors:
         raise HTTPException(status_code=400, detail={"message": "No valid images were uploaded.", "errors": errors})

    return TrainUploadResponse(
        success=True, 
        message=f"Processed {len(files)} files for label '{label}'. Saved: {len(saved_files_info)}. Errors: {len(errors)}.",
        saved_count=len(saved_files_info),
        label=label,
        saved_relative_paths=relative_paths,
        errors=errors
    )

@app.get("/history")
async def get_history(request: Request, limit: int = 50, skip: int = 0):
    if limit > 200: limit = 200 # Add a max limit
    logs = await db.get_history_logs(limit=limit, skip=skip)
    return JSONResponse(content={"success": True, "logs": logs})


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Uvicorn server directly...")
    uvicorn.run(app, host="127.0.0.1", port=8000)