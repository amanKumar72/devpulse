import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadToCloudinary(fileBuffer: Buffer, folder: string = 'devpulse'): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) return reject(error)
        if (!result) return reject(new Error('Cloudinary upload returned no result'))
        resolve(result.secure_url)
      }
    )
    uploadStream.end(fileBuffer)
  })
}

export default cloudinary
