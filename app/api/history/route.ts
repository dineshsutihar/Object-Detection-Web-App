import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import connectDb from '@/lib/mongodb';
import HistoryLog from '@/models/HistoryLog';
import { authMiddleware } from '@/lib/authMiddleware';

export const GET = (req: Request) => authMiddleware(req as any, handler);

async function handler(req: any): Promise<NextResponse> {
  const userId = req.userId as Types.ObjectId;

  await connectDb();

  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    if (isNaN(limit) || isNaN(skip) || limit <= 0 || skip < 0) {
      return NextResponse.json({ success: false, error: 'Invalid pagination parameters.' }, { status: 400 });
    }

    console.log(`[User: ${userId}] Fetching history: limit=${limit}, skip=${skip}`);

    const logs = await HistoryLog.find({ userId: userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      // Select fields - exclude large imageData by default unless requested?
      // .select('-imageData') // Example: Exclude image data for listing
      .lean();

    const totalCount = await HistoryLog.countDocuments({ userId: userId });

    return NextResponse.json({ success: true, logs: logs, totalCount });

  } catch (error: any) {
    console.error(`[User: ${userId}] Error fetching history:`, error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history logs.', detail: error.message },
      { status: 500 }
    );
  }
}