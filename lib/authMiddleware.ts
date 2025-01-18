import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export const authMiddleware = (req: Request) => {
  const token = req.headers.get('Authorization')?.split(' ')[1];

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, 'your_secret_key');
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
};
