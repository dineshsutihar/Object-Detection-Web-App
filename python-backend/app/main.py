import os
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
import base64
import io
import logging

from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# important if running in containers or restricted environments
TEMP_UPLOAD_DIR = Path("./temp_uploads")
TEMP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

YOLO_MODEL_NAME = os.getenv("YOLO_MODEL", "yolov8n.pt") 

app = FastAPI(title="YOLO Processing Engine API") 

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

try:
    logger.info(f"Loading YOLO model: {YOLO_MODEL_NAME}")
    model = YOLO(YOLO_MODEL_NAME)
    logger.info("YOLO model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load YOLO model '{YOLO_MODEL_NAME}': {e}")
    model = None


def process_yolo_results(results) -> List[Dict[str, Any]]:
    detections = []
    if results and results[0].boxes is not None:
        boxes = results[0].boxes.xyxyn.cpu().numpy()
        scores = results[0].boxes.conf.cpu().numpy()
        classes = results[0].boxes.cls.cpu().numpy().astype(int)
        class_names = results[0].names

        for i in range(len(boxes)):
            detections.append({ 
                "bbox_normalized": boxes[i].tolist(),
                "class_id": int(classes[i]),
                "class_name": class_names.get(int(classes[i]), "Unknown"), 
                "confidence": float(scores[i]),
            })
    return detections


@app.get("/")
async def root():
    return {"message": "YOLO Processing Engine is running."}

@app.post("/detect") 
async def detect_objects_upload(request: Request, file: UploadFile = File(...)):
    if model is None: raise HTTPException(status_code=503, detail="YOLO model not available.")
    if not file.content_type.startswith("image/"): raise HTTPException(status_code=400, detail="Invalid file type.")

    temp_file_path = None
    try:
        unique_id = uuid.uuid4()
        suffix = Path(file.filename).suffix if file.filename else ".tmp"
        temp_file_path = TEMP_UPLOAD_DIR / f"{unique_id}{suffix}"

        logger.info(f"Processing file '{file.filename}'...")
        contents = await file.read() 
        with open(temp_file_path, "wb") as f:
            f.write(contents)

        results = model(temp_file_path) # Option 2: Use temp file path

        detections = process_yolo_results(results)
        logger.info(f"Detection complete for '{file.filename}'. Found {len(detections)} objects.")
        return JSONResponse(content={"detections": detections})

    except Exception as e:
        logger.error(f"Error during detection for file '{file.filename}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
    finally:
        if temp_file_path and temp_file_path.exists():
            try:
                os.remove(temp_file_path)
                logger.debug(f"Removed temporary file: {temp_file_path}")
            except OSError as rm_err:
                logger.error(f"Error removing temporary file {temp_file_path}: {rm_err}")
        if file: await file.close()

@app.post("/detect-frame")
async def detect_objects_frame(request: Request, image_data: str = Form(...)):
    if model is None: raise HTTPException(status_code=503, detail="YOLO model not available.")

    try:
        logger.debug("Processing frame...")
        try:
            missing_padding = len(image_data) % 4
            if missing_padding: image_data += '='* (4 - missing_padding)
            image_bytes = base64.b64decode(image_data)
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as decode_err:
             logger.error(f"Failed to decode/open base64 image: {decode_err}")
             raise HTTPException(status_code=400, detail="Invalid image data format.")

        results = model(img) # Process PIL image directly
        detections = process_yolo_results(results)
        logger.debug(f"Frame detection complete. Found {len(detections)} objects.")

         # Return ONLY the detections list
        return JSONResponse(content={"detections": detections})

    except Exception as e:
        logger.error(f"Error during frame detection: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Frame detection failed: {str(e)}")

@app.post("/upload-train")
async def upload_training_images(
    request: Request,
    label: str = Form(...),
    files: List[UploadFile] = File(...)
):
    logger.info(f"Received {len(files)} file(s) for label '{label}'. Processing receipt...")
    received_count = 0
    processed_files = []
    temp_files_to_delete = []

    for file in files:
        temp_file_path = None
        try:
            # --- Optional: Save temporarily ONLY if you need to VALIDATE the image file itself ---
            # unique_id = uuid.uuid4()
            # suffix = Path(file.filename).suffix if file.filename else ".tmp"
            # temp_file_path = TEMP_UPLOAD_DIR / f"train_{unique_id}{suffix}"
            # temp_files_to_delete.append(temp_file_path) # Add to list for cleanup
            # with open(temp_file_path, "wb") as buffer:
            #     while content := await file.read(1024 * 1024): buffer.write(content)
            # logger.debug(f"Temporarily saved '{file.filename}' to validate.")
            # --- End Optional Save ---

             # You could add simple validation here if needed (e.g., check if it's a valid image)
             # For now, we just acknowledge receipt.
            received_count += 1
            processed_files.append(file.filename)

        except Exception as e:
            logger.error(f"Error processing receipt of file '{file.filename}': {e}", exc_info=True)
             # Don't raise immediately, just log
        finally:
            await file.close() # Ensure file handle is closed

    # --- IMPORTANT: Clean up ALL temporary files created in the loop ---
    # for temp_path in temp_files_to_delete:
    #     if temp_path.exists():
    #         try: os.remove(temp_path)
    #         except OSError as rm_err: logger.error(f"Error removing temp train file {temp_path}: {rm_err}")
    # --- End Cleanup ---

    logger.info(f"Acknowledged receipt of {received_count} files for label '{label}'.")

    return JSONResponse(content={
        "success": True,
        "message": f"Python backend acknowledged receipt of {received_count} files for label '{label}'.",
        "received_filenames": processed_files
    })

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Uvicorn server directly...")
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True) 