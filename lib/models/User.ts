import mongoose, { Schema } from 'mongoose'

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String },
  email: { type: String, required: true, unique: true },
  avatar: { type: String },
  bio: { type: String, default: '' },
  providers: [
    {
      name: { type: String, required: true }, // "credentials", "google", "github"
      id: { type: String, required: true } // username or provider identifier
    }
  ],
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.User || mongoose.model('User', UserSchema)
