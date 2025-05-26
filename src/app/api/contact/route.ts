import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message, projectType } = body;

    // Validate required fields
    if (!name || !email || !phone || !message) {
      logger.warn('[Contact] Missing required fields', { 
        hasName: !!name, 
        hasEmail: !!email, 
        hasPhone: !!phone, 
        hasMessage: !!message 
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare email content with RTL support and improved styling
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: `קיבלת מייל חדש מהאתר`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            /* Reset styles for email clients */
            body, table, td, div, p, a, span {
              direction: rtl !important;
              text-align: right !important;
              font-family: Arial, sans-serif !important;
            }
            
            /* Base styles */
            body {
              line-height: 1.6 !important;
              color: #333 !important;
              margin: 0 !important;
              padding: 0 !important;
              -webkit-text-size-adjust: 100% !important;
              -ms-text-size-adjust: 100% !important;
            }
            
            /* Container */
            .container {
              max-width: 600px !important;
              margin: 0 auto !important;
              padding: 20px !important;
              background-color: #ffffff !important;
            }
            
            /* Header */
            .header {
              background-color: #f3f4f6 !important;
              padding: 20px !important;
              border-radius: 8px !important;
              margin-bottom: 20px !important;
              text-align: center !important;
            }
            
            /* Content */
            .content {
              background-color: #ffffff !important;
              padding: 20px !important;
              border-radius: 8px !important;
              border: 1px solid #e5e7eb !important;
            }
            
            /* Fields */
            .field {
              margin-bottom: 15px !important;
              text-align: right !important;
            }
            
            .label {
              font-weight: bold !important;
              color: #4b5563 !important;
              margin-bottom: 5px !important;
              display: block !important;
              text-align: right !important;
            }
            
            .value {
              color: #1f2937 !important;
              text-align: right !important;
              display: block !important;
            }
            
            /* Message */
            .message {
              background-color: #f9fafb !important;
              padding: 15px !important;
              border-radius: 6px !important;
              border: 1px solid #e5e7eb !important;
              margin-top: 10px !important;
              white-space: pre-wrap !important;
              text-align: right !important;
            }
            
            /* Footer */
            .footer {
              margin-top: 20px !important;
              text-align: center !important;
              font-size: 0.9em !important;
              color: #6b7280 !important;
              direction: rtl !important;
            }
            
            /* Table-based layout for better email client support */
            .table {
              width: 100% !important;
              border-collapse: collapse !important;
            }
            
            .table td {
              padding: 0 !important;
              vertical-align: top !important;
            }
          </style>
        </head>
        <body>
          <table class="table" role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center">
                <table class="container" role="presentation" cellpadding="0" cellspacing="0" width="600">
                  <tr>
                    <td>
                      <div class="header">
                        <h2 style="margin: 0; color: #1f2937; text-align: center;">התקבל מייל חדש מהאתר</h2>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div class="content">
                        <div class="field">
                          <span class="label">שם:</span>
                          <span class="value">${name}</span>
                        </div>
                        
                        <div class="field">
                          <span class="label">אימייל:</span>
                          <span class="value">${email}</span>
                        </div>
                        
                        <div class="field">
                          <span class="label">טלפון:</span>
                          <span class="value">${phone}</span>
                        </div>
                        
                        <div class="field">
                          <span class="label">סוג הפרויקט:</span>
                          <span class="value">${
                            projectType === 'residential' ? 'מגורים' :
                            projectType === 'commercial' ? 'מסחרי' :
                            projectType === 'office' ? 'משרד' : 'אחר'
                          }</span>
                        </div>
                        
                        <div class="field">
                          <span class="label">הודעה:</span>
                          <div class="message">${message}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div class="footer">
                        <p style="margin: 0; text-align: center;">הודעה זו נשלחה מהטופס באתר</p>
                        <p style="margin: 10px 0 0 0; text-align: center;">זמן שליחה: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    logger.info('[Contact] Email sent successfully', { 
      to: process.env.EMAIL_USER,
      from: email,
      projectType 
    });

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[Contact] Error sending email', { error });
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
} 