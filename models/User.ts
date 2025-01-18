import mongoose, { Schema, Document } from 'mongoose';

interface User extends Document {
  username: string;
  email: string;
  password: string;
}

const userSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model<User>('User', userSchema);

export default User;
