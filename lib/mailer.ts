import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVICE || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export async function sendWelcomeEmail(to: string, username: string) {
  if (!to || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Skipping email send - missing credentials/target email')
    return
  }
  const mailOptions = {
    from: `"DevPulse" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Welcome to DevPulse!',
    html: `
      <div style="font-family: monospace; background-color: #0b0f19; color: #ffffff; padding: 20px; border: 3px solid #10b981; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; font-size: 1.5rem;">[DEVPULSE] WELCOME.EXE</h1>
        <p>Hello, <strong>${username}</strong>!</p>
        <p>Your developer profile has been successfully compiled and initialized on DevPulse.</p>
        <p>Here is what you can do now:</p>
        <ul style="line-height: 1.6;">
          <li>Browse curated trending articles</li>
          <li>Bookmark articles to read later and add custom notes</li>
          <li>Submit new developer links and articles</li>
          <li>Engage in discussions by leaving comments</li>
        </ul>
        <p>Welcome to the node network!</p>
        <p style="margin-top: 30px; border-top: 1px solid #10b981; padding-top: 10px; font-size: 0.8rem; color: #888;">
          System Timestamp: ${new Date().toISOString()}
        </p>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Welcome email sent: %s', info.messageId)
    return info
  } catch (error) {
    console.error('Error sending welcome email:', error)
  }
}

export async function sendCommentAlert(to: string, articleTitle: string, commenterName: string, commentContent: string) {
  if (!to || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Skipping comment email send - missing credentials/target email')
    return
  }
  const mailOptions = {
    from: `"DevPulse" <${process.env.EMAIL_USER}>`,
    to,
    subject: `New Comment on "${articleTitle}"`,
    html: `
      <div style="font-family: monospace; background-color: #0b0f19; color: #ffffff; padding: 20px; border: 3px solid #10b981; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; font-size: 1.5rem;">[DEVPULSE] NOTIFICATION.LOG</h1>
        <p>Hello,</p>
        <p>Your article <strong>"${articleTitle}"</strong> received a new comment from <strong>${commenterName}</strong>:</p>
        <div style="background-color: #1e293b; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0;">
          <p style="margin: 0; font-style: italic;">"${commentContent}"</p>
        </div>
        <p>Click <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="color: #10b981; text-decoration: underline;">here</a> to view the article and join the conversation.</p>
        <p style="margin-top: 30px; border-top: 1px solid #10b981; padding-top: 10px; font-size: 0.8rem; color: #888;">
          System Timestamp: ${new Date().toISOString()}
        </p>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Comment alert email sent: %s', info.messageId)
    return info
  } catch (error) {
    console.error('Error sending comment alert email:', error)
  }
}
