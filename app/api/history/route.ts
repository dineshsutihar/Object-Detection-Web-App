import { NextRequest, NextResponse } from 'next/server';

interface ErrorResponse { success: false; error: string; detail?: any; }
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '50';
  const skip = searchParams.get('skip') || '0';

  console.log(`Fetching history: limit=${limit}, skip=${skip}`);
  let pythonResponse;

  try {
    pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/history?limit=${limit}&skip=${skip}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!pythonResponse.ok) {
      let errorDetail = 'History service failed.';
      try { const errorJson = await pythonResponse.json(); errorDetail = errorJson.detail || JSON.stringify(errorJson); } catch (e) { errorDetail = pythonResponse.statusText; }
      console.error(`Python history fetch error: ${errorDetail}`);
      return NextResponse.json<ErrorResponse>(
        { success: false, error: 'Failed to fetch history.', detail: errorDetail },
        { status: pythonResponse.status }
      );
    }

    const result = await pythonResponse.json();
    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error('Error in /api/history proxy:', error);
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json<ErrorResponse>({ success: false, error: 'History service unavailable.' }, { status: 503 });
    }
    return NextResponse.json<ErrorResponse>(
      { success: false, error: 'Internal Server Error fetching history.', detail: error.message },
      { status: 500 }
    );
  }
}