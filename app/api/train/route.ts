import { NextRequest, NextResponse } from 'next/server';

interface PythonTrainSuccessResponse {
  success: true;
  message: string;
  saved_count: number;
  saved_filenames: string[];
  errors: Array<{ filename: string; error: string }>;
}

interface ErrorResponse {
  success: false;
  error: string;
  detail?: any;
}

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  console.log('API Route /api/train hit');
  let pythonResponse;

  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[]; // Key 'images' must match frontend

    if (!files || files.length === 0) {
      console.error('No image files found in form data for training.');
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'No image files provided for training.' },
        { status: 400 }
      );
    }

    console.log(`Forwarding ${files.length} file(s) for training to Python backend at ${PYTHON_BACKEND_URL}/upload-train`);

    const pythonFormData = new FormData();
    files.forEach((file) => {
      pythonFormData.append('files', file, file.name);
    });

    pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/upload-train`, {
      method: 'POST',
      body: pythonFormData,
    });

    console.log(`Python backend response status (training upload): ${pythonResponse.status}`);

    if (!pythonResponse.ok) {
      let errorDetail = 'Unknown error from training upload service.';
      try {
        const errorJson = await pythonResponse.json();
        errorDetail = errorJson.detail || JSON.stringify(errorJson) || pythonResponse.statusText;
        console.error(`Python backend error (training upload): ${errorDetail}`);
      } catch (parseError) {
        errorDetail = pythonResponse.statusText;
        console.error(`Python backend error (training upload, non-JSON): ${errorDetail}`);
      }
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Training image upload service failed.', detail: errorDetail },
        { status: pythonResponse.status }
      );
    }

    const result: PythonTrainSuccessResponse = await pythonResponse.json();
    console.log(`Received response from Python backend: ${result.message}`);

    return NextResponse.json(result, { status: pythonResponse.status }); // Can be 200 or potentially 207 (Multi-Status) if partial failures

  } catch (error: any) {
    console.error('Error in /api/train proxy route:', error);

    if (error.cause && error.cause.code === 'ECONNREFUSED') {
      console.error('Connection refused by Python backend.');
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Training upload service is unavailable.' },
        { status: 503 } // Service Unavailable
      );
    }

    return NextResponse.json<ErrorResponse>(
      { success: false, error: 'Internal Server Error processing training upload.', detail: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST to upload training images" }, { status: 405 });
}