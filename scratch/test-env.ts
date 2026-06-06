import dotenv from 'dotenv'
dotenv.config()

console.log('--- dotenv output ---')
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID, 'length:', process.env.GOOGLE_CLIENT_ID?.length)
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET, 'length:', process.env.GOOGLE_CLIENT_SECRET?.length)
console.log('GITHUB_CLIENT_ID:', process.env.GITHUB_CLIENT_ID, 'length:', process.env.GITHUB_CLIENT_ID?.length)
console.log('GITHUB_CLIENT_SECRET:', process.env.GITHUB_CLIENT_SECRET, 'length:', process.env.GITHUB_CLIENT_SECRET?.length)
