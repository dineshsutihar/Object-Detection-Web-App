import { NextRequest, NextResponse } from 'next/server';

interface ErrorResponse { success: false; error: string; detail?: any; }
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  let pythonResponse;
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    const label = formData.get('label') as string | null;
    if (!files || files.length === 0) {
      return NextResponse.json<ErrorResponse>({ success: false, error: 'No image files provided.' }, { status: 400 });
    }
    if (!label || label.trim() === '') {
      return NextResponse.json<ErrorResponse>({ success: false, error: 'Object label is required.' }, { status: 400 });
    }

    console.log(`Forwarding ${files.length} file(s) with label '${label}' for training to Python`);

    const pythonFormData = new FormData();
    pythonFormData.append('label', label);
    files.forEach((file) => {
      pythonFormData.append('files', file, file.name);
    });

    pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/upload-train`, {
      method: 'POST',
      body: pythonFormData,
    });

    if (!pythonResponse.ok) {
      let errorDetail = 'Training upload service failed.';
      try { const errorJson = await pythonResponse.json(); errorDetail = errorJson.detail || JSON.stringify(errorJson); } catch (e) { errorDetail = pythonResponse.statusText; }
      console.error(`Python train upload error: ${errorDetail}`);
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Training upload failed.', detail: errorDetail },
        { status: pythonResponse.status }
      );
    }

    const result = await pythonResponse.json();
    return NextResponse.json(result, { status: pythonResponse.status });

  } catch (error: any) {
    console.error('Error in /api/train proxy:', error);
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json<ErrorResponse>({ success: false, error: 'Training upload service unavailable.' }, { status: 503 });
    }
    return NextResponse.json<ErrorResponse>(
      { success: false, error: 'Internal Server Error processing training upload.', detail: error.message },
      { status: 500 }
    );
  }
}