import mongoose, { Schema } from 'mongoose'

const CommentSchema = new Schema({
  articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema)
