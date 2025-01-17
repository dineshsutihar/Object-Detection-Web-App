import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value
    console.log('Token from cookies:', token)
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }



    const decoded = verify(token, JWT_SECRET)
    console.log('Decoded token:', decoded)

    if (decoded) {
      return NextResponse.json({ authenticated: true, user: decoded }, { status: 200 })
    } else {
      return NextResponse.json({ authenticated: false }, { status: 200 })
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 200 })
  }
}
