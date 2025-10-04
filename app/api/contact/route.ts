import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, phone, message } = body;

    console.log('Contact form submission:', { name, email, company, phone });
    console.log('Resend API Key exists:', !!process.env.RESEND_API_KEY);

    // Send email using Resend
    // Note: The 'from' email must be verified in Resend dashboard
    // For now, using onboarding@resend.dev which works for testing
    const { data, error } = await resend.emails.send({
      from: 'Triya.ai Contact Form <onboarding@resend.dev>',
      to: ['admin@triya.ai'],
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Contact Form Submission</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          </div>
          <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
            <h3 style="color: #333;">Message:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from the contact form on triya.ai
          </p>
        </div>
      `,
      text: `
New Contact Form Submission

Name: ${name}
Email: ${email}
Company: ${company || 'Not provided'}
Phone: ${phone || 'Not provided'}

Message:
${message}

---
This email was sent from the contact form on triya.ai
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Also send a confirmation email to the user
    await resend.emails.send({
      from: 'Triya.ai <onboarding@resend.dev>',
      to: [email],
      subject: 'Thank you for contacting Triya.ai',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Thank you for reaching out!</h2>
          <p>Dear ${name},</p>
          <p>We've received your message and will get back to you within 24 hours.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333;">Your submission:</h3>
            <p><strong>Message:</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
          <p>In the meantime, feel free to explore our website to learn more about our AI-powered security solutions.</p>
          <p>Best regards,<br>The Triya.ai Team</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Triya.ai - Transform any camera into AI-powered security<br>
            Abu Dhabi Global Market, UAE<br>
            <a href="https://triya.ai" style="color: #0066cc;">www.triya.ai</a>
          </p>
        </div>
      `,
      text: `
Thank you for reaching out!

Dear ${name},

We've received your message and will get back to you within 24 hours.

Your submission:
${message}

In the meantime, feel free to explore our website to learn more about our AI-powered security solutions.

Best regards,
The Triya.ai Team

---
Triya.ai - Transform any camera into AI-powered security
Abu Dhabi Global Market, UAE
www.triya.ai
      `,
    });

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in contact API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}