import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextResponse, NextRequest } from 'next/server';
import { Types } from 'mongoose';

interface AuthenticatedRequest extends NextRequest {
  userId?: Types.ObjectId;
  userEmail?: string;
}

interface DecodedToken extends JwtPayload {
  id: string;
  email: string;
}

export async function authMiddleware(req: NextRequest, handler: (req: AuthenticatedRequest) => Promise<NextResponse>): Promise<NextResponse> {
  const token = req.cookies.get('token')?.value || req.headers.get('Authorization')?.split(' ')[1];

  if (!token) {
    console.warn('Auth Middleware: No token found');
    return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('Auth Middleware: JWT_SECRET environment variable is not set.');
    return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.userId = new Types.ObjectId(decoded.id);
    authenticatedReq.userEmail = decoded.email;

    return await handler(authenticatedReq);

  } catch (error: any) {
    console.error('Auth Middleware: Invalid token.', error.message);
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json({ success: false, error: 'Token expired. Please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ success: false, error: 'Invalid token.' }, { status: 401 });
  }
}

export function getUserIdFromToken(req: NextRequest): Types.ObjectId | null {
  const token = req.cookies.get('token')?.value || req.headers.get('Authorization')?.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!token || !jwtSecret) return null;

  try {
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    return new Types.ObjectId(decoded.id);
  } catch (error) {
    return null;
  }
}