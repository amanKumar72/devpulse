import mongoose, { Schema } from 'mongoose'

const BookmarkSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
})

BookmarkSchema.index({ userId: 1, articleId: 1 }, { unique: true })

export default mongoose.models.Bookmark || mongoose.model('Bookmark', BookmarkSchema)
