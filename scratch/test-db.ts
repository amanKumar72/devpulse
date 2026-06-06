import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const MONGODB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/devpulse'

async function runTest() {
  console.log('Connecting to database:', MONGODB_URI)
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✓ MongoDB connection established successfully.')

    const db = mongoose.connection.db
    if (db) {
      const collections = await db.listCollections().toArray()
      console.log('Active collections:', collections.map(c => c.name))
    }

    await mongoose.disconnect()
    console.log('✓ Disconnected from MongoDB.')
    process.exit(0)
  } catch (error) {
    console.error('✗ Test failed with error:', error)
    process.exit(1)
  }
}

runTest()
