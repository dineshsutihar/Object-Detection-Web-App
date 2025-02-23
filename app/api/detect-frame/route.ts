import { NextRequest, NextResponse } from 'next/server';

interface ErrorResponse { success: false; error: string; detail?: any; }
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  let pythonResponse;
  try {
    const formData = await request.formData();
    const imageData = formData.get('imageData') as string | null;
    if (!imageData) {
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'No image data provided.' }, { status: 400 }
      );
    }

    const pythonFormData = new FormData();
    pythonFormData.append('image_data', imageData);

    pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/detect-frame`, {
      method: 'POST',
      body: pythonFormData,
    });

    if (!pythonResponse.ok) {
      let errorDetail = 'Frame detection service failed.';
      try { const errorJson = await pythonResponse.json(); errorDetail = errorJson.detail || JSON.stringify(errorJson); } catch (e) { errorDetail = pythonResponse.statusText; }
      console.error(`Python frame detect error: ${errorDetail}`);
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Frame detection failed.', detail: errorDetail },
        { status: pythonResponse.status }
      );
    }

    const result = await pythonResponse.json();
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Error in /api/detect-frame proxy:', error);
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json<ErrorResponse>({ success: false, error: 'Detection service unavailable.' }, { status: 503 });
    }
    return NextResponse.json<ErrorResponse>(
      { success: false, error: 'Internal Server Error processing frame.', detail: error.message },
      { status: 500 }
    );
  }
}