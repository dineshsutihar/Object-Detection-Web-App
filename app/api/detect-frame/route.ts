import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDb from '@/lib/mongodb';
import HistoryLog from '@/models/HistoryLog';
import { authMiddleware } from '@/lib/authMiddleware';

// TODO: Refactor this to use a more specific type for detections and write all the interface in seperate files
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
    const imageDataBase64 = formData.get('imageData') as string | null; // Raw Base64 data

    if (!imageDataBase64) {
      return NextResponse.json<NextDetectApiResponse>({ success: false, error: 'No image data provided.' }, { status: 400 });
    }

    const mimeType = 'image/jpeg';
    const imageDataUri = `data:${mimeType};base64,${imageDataBase64}`;

    // logEntry = new HistoryLog({ ... status: 'pending' ... });
    // await logEntry.save();

    // 2. Forward Base64 data to Python (as form data)
    const pythonFormData = new FormData();
    pythonFormData.append('image_data', imageDataBase64);

    // logEntry.status = 'processing';
    // await logEntry.save();

    const pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/detect-frame`, {
      method: 'POST',
      body: pythonFormData,
    });

    if (!pythonResponse.ok) {
      console.warn(`[User: ${userId}] Python frame detect error: ${pythonResponse.statusText}`);
      return NextResponse.json<NextDetectApiResponse>(
        { success: false, error: 'Frame detection failed.' },
        { status: 502 }
      );
    }

    const result: PythonDetectResponse = await pythonResponse.json();

    if (result.detections && result.detections.length > 0) {
      logEntry = new HistoryLog({
        userId: userId,
        type: 'detection',
        status: 'success',
        detectionSource: 'live_frame',
        imageData: imageDataUri,
        detectionResults: result.detections,
      });
      await logEntry.save();
      console.log(`[Log: ${logEntry._id}] Logged successful frame detection.`);
    } else {
      console.debug(`[User: ${userId}] Frame processed, no objects detected.`); // remove later
    }


    return NextResponse.json<NextDetectApiResponse>(
      { success: true, logId: logEntry?._id?.toString(), detections: result.detections },
      { status: 200 }
    );

  } catch (error: any) {
    console.error(`[User: ${userId}] Error in /api/detect-frame:`, error);
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json<NextDetectApiResponse>({ success: false, error: 'Detection service unavailable.' }, { status: 503 });
    }
    return NextResponse.json<NextDetectApiResponse>(
      { success: false, error: 'Internal Server Error.', detail: error.message },
      { status: 500 }
    );
  }
}