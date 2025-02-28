import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDb from '@/lib/mongodb';
import HistoryLog from '@/models/HistoryLog';
import { authMiddleware } from '@/lib/authMiddleware';

interface NextTrainApiResponse {
  success: boolean;
  logId?: string;
  message?: string;
  pythonStatus?: any;
  error?: string;
  detail?: any;
}

interface PythonTrainResponse {
  success: boolean;
  message: string;
  // Maybe other details like how many files it received
}

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export const POST = (req: Request) => authMiddleware(req as any, handler);

async function handler(req: any): Promise<NextResponse> {
  const userId = req.userId as Types.ObjectId;
  let logEntry;

  await connectDb();

  try {
    const formData = await req.formData();
    const files = formData.getAll('images') as File[];
    const label = formData.get('label') as string | null;

    if (!files || files.length === 0) return NextResponse.json({ success: false, error: 'No image files provided.' }, { status: 400 });
    if (!label || label.trim() === '') return NextResponse.json({ success: false, error: 'Object label is required.' }, { status: 400 });

    const imageBase64Array: string[] = [];
    const originalFilenames: string[] = [];
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      imageBase64Array.push(`data:${file.type || 'image/jpeg'};base64,${imageBuffer.toString('base64')}`);
      originalFilenames.push(file.name);
    }

    logEntry = new HistoryLog({
      userId: userId,
      type: 'training_upload',
      status: 'pending',
      trainingLabel: label.trim(),
      trainingFileCount: files.length,
      trainingOriginalFilenames: originalFilenames,
      imageData: imageBase64Array,
    });
    await logEntry.save();
    console.log(`[User: ${userId}] Created pending training log: ${logEntry._id} for label '${label}'`);

    const pythonFormData = new FormData();
    pythonFormData.append('label', label.trim());
    files.forEach((file, index) => {
      const blob = new Blob([Buffer.from(imageBase64Array[index].split(',')[1], 'base64')], { type: file.type });
      pythonFormData.append('files', blob, file.name);
    });

    logEntry.status = 'processing';
    await logEntry.save();

    console.log(`[Log: ${logEntry._id}] Forwarding ${files.length} files for label '${label}' to Python...`);
    const pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/upload-train`, {
      method: 'POST',
      body: pythonFormData,
    });

    let pythonResult: PythonTrainResponse | null = null;
    let pythonErrorDetail = 'Python training upload service failed.';
    if (!pythonResponse.ok) {
      try { const errorJson = await pythonResponse.json(); pythonErrorDetail = errorJson.detail || JSON.stringify(errorJson); } catch (e) { pythonErrorDetail = pythonResponse.statusText; }
      console.error(`[Log: ${logEntry._id}] Python backend error: ${pythonErrorDetail}`);
      logEntry.status = 'failure';
      logEntry.errorMessage = pythonErrorDetail;
      await logEntry.save();
      return NextResponse.json<NextTrainApiResponse>(
        { success: false, logId: logEntry._id.toString(), error: 'Training data upload processing failed.', detail: pythonErrorDetail },
        { status: 502 }
      );
    }

    pythonResult = await pythonResponse.json();

    logEntry.status = 'success';
    await logEntry.save();
    console.log(`[Log: ${logEntry._id}] Training data upload processed by Python.`);

    return NextResponse.json<NextTrainApiResponse>(
      { success: true, logId: logEntry._id.toString(), message: "Training data received.", pythonStatus: pythonResult },
      { status: 200 }
    );

  } catch (error: any) {
    console.error(`[User: ${userId}] Error in /api/train:`, error);
    if (logEntry && logEntry._id) {
      try {
        logEntry.status = 'failure';
        logEntry.errorMessage = error.message || 'Next.js API route error';
        await logEntry.save();
      } catch (logError) { console.error(`[Log: ${logEntry._id}] Failed to update log on error:`, logError); }
    }
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json<NextTrainApiResponse>({ success: false, logId: logEntry?._id.toString(), error: 'Training upload service unavailable.' }, { status: 503 });
    }
    return NextResponse.json<NextTrainApiResponse>(
      { success: false, logId: logEntry?._id.toString(), error: 'Internal Server Error.', detail: error.message },
      { status: 500 }
    );
  }
}