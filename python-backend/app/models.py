from pydantic import BaseModel, Field
from typing import List, Tuple, Optional
from datetime import datetime

class DetectionResult(BaseModel):
    bbox_normalized: Tuple[float, float, float, float] = Field(..., description="Bounding box [xmin, ymin, xmax, ymax] normalized 0-1")
    class_id: int
    class_name: str
    confidence: float

class DetectionResponse(BaseModel):
    success: bool
    filename: Optional[str] = None # Filename if from upload
    detections: List[DetectionResult]

class TrainUploadResponse(BaseModel):
    success: bool
    message: str
    saved_count: int
    label: str
    saved_relative_paths: List[str] # Relative paths within uploads dir
    errors: List[dict]

class LogEntryBase(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "success" # 'success' or 'failure'

class DetectionLogEntry(LogEntryBase):
    type: str = "detection"
    source_filename: Optional[str] = None # Original filename if uploaded
    source_type: str # 'upload' or 'live_frame'
    detections: List[DetectionResult] = []

class TrainingLogEntry(LogEntryBase):
    type: str = "training_upload"
    label: str
    uploaded_filenames: List[str] # Original filenames
    saved_relative_paths: List[str] # Paths relative to UPLOAD_DIR
    file_count: int
