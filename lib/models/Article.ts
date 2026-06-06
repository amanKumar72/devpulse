import mongoose, { Schema } from 'mongoose'

const ArticleSchema = new Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  tag: { type: String, required: true, lowercase: true, index: true },
  description: { type: String },
  coverImage: { type: String },
  author: { type: String, default: 'Anonymous' },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  upvotes: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  publishedAt: { type: Date, default: Date.now },
  externalId: { type: String, unique: true, sparse: true } // to prevent duplicates when syncing from external API
})

export default mongoose.models.Article || mongoose.model('Article', ArticleSchema)
