import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDb from '@/lib/mongodb';
import HistoryLog from '@/models/HistoryLog';
import { authMiddleware } from '@/lib/authMiddleware';
import { ZodError } from 'zod';

interface NextDetectApiResponse {
  success: boolean;
  logId?: string;
  detections?: any[];
  error?: string;
  detail?: any;
}

interface PythonDetectResponse {
  detections: any[];
}

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export const POST = (req: Request) => authMiddleware(req as any, handler);

async function handler(req: any): Promise<NextResponse> {
  const userId = req.userId as Types.ObjectId;
  let logEntry;

  await connectDb();

  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json<NextDetectApiResponse>(
        { success: false, error: 'No image file provided.' }, { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);
    const imageBase64 = imageBuffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const imageDataUri = `data:${mimeType};base64,${imageBase64}`;


    logEntry = new HistoryLog({
      userId: userId,
      type: 'detection',
      status: 'pending',
      detectionSource: 'upload',
      originalFilename: file.name,
      imageData: imageDataUri,
    });
    await logEntry.save();
    console.log(`[User: ${userId}] Created pending detection log: ${logEntry._id}`);

    const pythonFormData = new FormData();
    const blob = new Blob([imageBuffer], { type: file.type });
    pythonFormData.append('file', blob, file.name);

    logEntry.status = 'processing';
    await logEntry.save();

    console.log(`[Log: ${logEntry._id}] Forwarding '${file.name}' to Python backend...`);
    const pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/detect`, {
      method: 'POST',
      body: pythonFormData,
    });

    if (!pythonResponse.ok) {
      let errorDetail = 'Python detection service failed.';
      try {
        const errorJson = await pythonResponse.json();
        errorDetail = errorJson.detail || JSON.stringify(errorJson);
      } catch (e) { errorDetail = pythonResponse.statusText; }

      console.error(`[Log: ${logEntry._id}] Python backend error: ${errorDetail}`);
      logEntry.status = 'failure';
      logEntry.errorMessage = errorDetail;
      await logEntry.save();
      return NextResponse.json<NextDetectApiResponse>(
        { success: false, logId: logEntry._id.toString(), error: 'Detection processing failed.', detail: errorDetail },
        { status: 502 }
      );
    }

    const result: PythonDetectResponse = await pythonResponse.json();

    logEntry.status = 'success';
    logEntry.detectionResults = result.detections;
    await logEntry.save();
    console.log(`[Log: ${logEntry._id}] Detection successful. Found ${result.detections?.length ?? 0} objects.`);

    return NextResponse.json<NextDetectApiResponse>(
      { success: true, logId: logEntry._id.toString(), detections: result.detections },
      { status: 200 }
    );

  } catch (error: any) {
    console.error(`[User: ${userId}] Error in /api/detect:`, error);
    if (logEntry && logEntry._id) {
      try {
        logEntry.status = 'failure';
        logEntry.errorMessage = error.message || 'Next.js API route error';
        await logEntry.save();
      } catch (logError) {
        console.error(`[Log: ${logEntry._id}] Failed to update log status on error:`, logError);
      }
    }
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json<NextDetectApiResponse>({ success: false, logId: logEntry?._id.toString(), error: 'Detection service unavailable.' }, { status: 503 });
    }
    return NextResponse.json<NextDetectApiResponse>(
      { success: false, logId: logEntry?._id.toString(), error: 'Internal Server Error.', detail: error.message },
      { status: 500 }
    );
  }
}