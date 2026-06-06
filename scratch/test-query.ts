import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../lib/models/User'

dotenv.config()

const MONGODB_URI = process.env.MONGO_DB_URI || 'mongodb://localhost:27017/devpulse'

async function run() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to DB')
    const users = await User.find({})
    console.log('All Users:')
    console.log(JSON.stringify(users, null, 2))
    
    // Test the original query style
    const testGoogle = await User.findOne({ 'providers.name': 'google', 'providers.id': 'some-id' })
    console.log('Query result without $elemMatch:', testGoogle)
    
    // Test the $elemMatch query style
    const testGoogleElem = await User.findOne({ providers: { $elemMatch: { name: 'google', id: 'some-id' } } })
    console.log('Query result with $elemMatch:', testGoogleElem)

    await mongoose.disconnect()
  } catch (err) {
    console.error(err)
  }
}

run()
