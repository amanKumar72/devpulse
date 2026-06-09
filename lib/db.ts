import mongoose from 'mongoose'
import dns from 'dns'

function cleanEnvValue(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, '') || ''
}

const MONGO_DB_URI =
  cleanEnvValue(process.env.MONGO_DB_URI)
const MONGO_DNS_SERVERS =
  cleanEnvValue(process.env.MONGO_DNS_SERVERS) || '1.1.1.1,1.0.0.1,8.8.8.8,8.8.4.4'

if (!MONGO_DB_URI) {
  throw new Error('Please define the MONGO_DB_URI or MONGODB_URI environment variable inside .env')
}

if (MONGO_DB_URI.startsWith('mongodb+srv://')) {
  dns.setServers(
    MONGO_DNS_SERVERS.split(',')
      .map((server) => server.trim())
      .filter(Boolean)
  )
  console.info('MongoDB SRV DNS servers:', dns.getServers())
}

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var mongoose: MongooseCache | undefined
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
  if (cached!.conn) {
    return cached!.conn
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    }

    cached!.promise = mongoose.connect(MONGO_DB_URI, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached!.conn = await cached!.promise
  } catch (e) {
    cached!.promise = null
    throw e
  }

  return cached!.conn
}

export default dbConnect
