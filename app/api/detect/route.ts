import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

interface Detection {
  bbox_normalized: [number, number, number, number];
  class_id: number;
  class_name: string;
  confidence: number;
}

interface PythonDetectSuccessResponse {
  success: true;
  filename: string;
  detections: Detection[];
}

interface ErrorResponse {
  success: false;
  error: string;
  detail?: any;
}


const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  console.log('API Route /api/detect hit');
  let pythonResponse; // To store the response from Python

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      console.error('No image file found in form data');
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'No image file provided.' },
        { status: 400 }
      );
    }

    console.log(`Forwarding file '${file.name}' (${Math.round(file.size / 1024)} KB) to Python backend at ${PYTHON_BACKEND_URL}/detect`);

    const pythonFormData = new FormData();
    pythonFormData.append('file', file, file.name);

    pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/detect`, {
      method: 'POST',
      body: pythonFormData,
    });

    console.log(`Python backend response status: ${pythonResponse.status}`);

    if (!pythonResponse.ok) {
      let errorDetail = 'Unknown error from detection service.';
      try {
        const errorJson = await pythonResponse.json();
        errorDetail = errorJson.detail || JSON.stringify(errorJson) || pythonResponse.statusText;
        console.error(`Python backend error: ${errorDetail}`);
      } catch (parseError) {
        // If parsing fails, use the status text
        errorDetail = pythonResponse.statusText;
        console.error(`Python backend error (non-JSON): ${errorDetail}`);
      }
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Detection service failed.', detail: errorDetail },
        { status: pythonResponse.status } // Proxy the status code
      );
    }

    const result: PythonDetectSuccessResponse = await pythonResponse.json();
    console.log(`Received ${result.detections.length} detections from Python backend.`);

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Error in /api/detect proxy route:', error);

    if (error instanceof ZodError) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Invalid request data.', detail: error.errors },
        { status: 400 }
      );
    }

    if (error.cause && error.cause.code === 'ECONNREFUSED') {
      console.error('Connection refused by Python backend.');
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Detection service is unavailable.' },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json<ErrorResponse>(
      { success: false, error: 'Internal Server Error processing detection request.', detail: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to detect objects" }, { status: 405 });
}