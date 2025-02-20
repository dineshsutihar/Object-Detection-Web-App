import os
import uuid
from pathlib import Path
from typing import List, Dict, Any

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware # Allow frontend requests
from PIL import Image
import io
import logging
from ultralytics import YOLO
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads/training_images"))
YOLO_MODEL_NAME = os.getenv("YOLO_MODEL", "yolov8n.pt")

# Ensure upload directory exists
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
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
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
        boxes = results[0].boxes.xyxyn.cpu().numpy()  # Normalized xyxy
        scores = results[0].boxes.conf.cpu().numpy()
        classes = results[0].boxes.cls.cpu().numpy().astype(int)
        class_names = results[0].names

        for i in range(len(boxes)):
            detections.append({
                "bbox_normalized": boxes[i].tolist(),
                "class_id": int(classes[i]),
                "class_name": class_names[classes[i]],
                "confidence": float(scores[i]),
            })
    return detections

@app.get("/")
async def root():
    return {"message": "YOLO API is running."}

@app.post("/detect")
async def detect_objects(request: Request, file: UploadFile = File(...)):
    """
    Accepts a single image file and returns YOLO detection results.
    """
    if model is None:
        raise HTTPException(status_code=503, detail="YOLO model is not available.")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    try:
        logger.info(f"Received file '{file.filename}' for detection.")
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB") # Ensure RGB

        logger.info("Running YOLO detection...")
        results = model(img) # Perform inference
        logger.info("Detection complete.")

        # Process results
        detections = process_yolo_results(results)
        logger.info(f"Found {len(detections)} objects.")

        return JSONResponse(content={
            "success": True,
            "filename": file.filename,
            "detections": detections
        })

    except Exception as e:
        logger.error(f"Error during detection for file '{file.filename}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
    finally:
        await file.close()


@app.post("/upload-train")
async def upload_training_images(request: Request, files: List[UploadFile] = File(...)):
    """
    Accepts multiple image files and saves them to the designated training folder.
    Does NOT perform actual training.
    """
    saved_files = []
    errors = []
    logger.info(f"Received {len(files)} file(s) for training upload.")

    for file in files:
        if not file.content_type.startswith("image/"):
            errors.append({
                "filename": file.filename,
                "error": "Invalid file type. Only images are allowed."
            })
            logger.warning(f"Skipping non-image file: {file.filename}")
            continue

        try:
            unique_id = uuid.uuid4()
            file_extension = Path(file.filename).suffix if file.filename else '.jpg'
            safe_filename = f"{unique_id}{file_extension}"
            save_path = UPLOAD_DIR / safe_filename

            with open(save_path, "wb") as buffer:
                while content := await file.read(1024 * 1024): # Read 1MB chunks
                     buffer.write(content)

            saved_files.append(file.filename)
            logger.info(f"Successfully saved training image '{file.filename}' as '{safe_filename}'")

        except Exception as e:
            logger.error(f"Error saving file '{file.filename}': {e}", exc_info=True)
            errors.append({"filename": file.filename, "error": str(e)})
        finally:
            await file.close() # Ensure file handle is closed

    if not saved_files and errors:
         raise HTTPException(status_code=400, detail={"message": "No valid images were uploaded.", "errors": errors})

    return JSONResponse(content={
        "success": True,
        "message": f"Successfully received {len(saved_files)} out of {len(files)} files.",
        "saved_count": len(saved_files),
        "saved_filenames": saved_files, # Original filenames
        "errors": errors
    })

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Uvicorn server directly (use 'uvicorn' command for production/reload)...")
    uvicorn.run(app, host="127.0.0.1", port=8000)