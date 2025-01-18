import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '../../../../models/User';
import connectDb from '../../../../lib/mongodb';

export const POST = async (req: Request) => {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
    }

    await connectDb();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    return NextResponse.json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
};
