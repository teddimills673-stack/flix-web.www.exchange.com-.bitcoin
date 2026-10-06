import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';

// In-memory store for OTP records (persisted across requests in Node server)
declare global {
  var otpStore: Map<string, {
    hash: string;
    expiresAt: number;
    createdAt: number;
    attempts: number;
    used: boolean;
  }>;
}

if (!global.otpStore) {
  global.otpStore = new Map();
}

export async function POST(req: NextRequest) {
  console.log('[DIAGNOSTIC] POST /api/auth/send-otp endpoint reached.');

  try {
    const { email, purpose = 'auth' } = await req.json();

    if (!email || typeof email !== 'string') {
      console.error('[DIAGNOSTIC] Invalid or missing email address provided.');
      return NextResponse.json({ success: false, error: 'Valid email address is required.' }, { status: 400 });
    }

    const emailKey = email.toLowerCase().trim();
    const recipientDomain = emailKey.includes('@') ? emailKey.split('@')[1] : 'unknown';
    console.log(`[DIAGNOSTIC] Recipient domain: ***@${recipientDomain}`);

    // Rate limiting / resend cooldown protection (minimum 5 seconds between requests)
    const existingRecord = global.otpStore.get(emailKey);
    if (existingRecord && (Date.now() - existingRecord.createdAt < 5000)) {
      console.warn('[DIAGNOSTIC] Rate limit hit for email key.');
      return NextResponse.json({ 
        success: false, 
        error: 'Rate limit exceeded. Please wait a few seconds before requesting another verification code.' 
      }, { status: 429 });
    }

    // Generate 6-digit cryptographic OTP using crypto.randomInt (server-side only)
    const otp = crypto.randomInt(100000, 1000000).toString();
    const createdAt = Date.now();
    const expiresAt = createdAt + 30 * 1000; // Exactly 30 seconds expiration authority

    // Securely hash OTP (SHA-256)
    const hash = crypto.createHash('sha256').update(otp).digest('hex');

    // Store OTP record securely server-side
    global.otpStore.set(emailKey, {
      hash,
      expiresAt,
      createdAt,
      attempts: 0,
      used: false,
    });

    const resendApiKey = process.env.RESEND_API_KEY;
    const hasApiKey = Boolean(resendApiKey && resendApiKey.trim().length > 0);
    const senderEmail = process.env.RESEND_SENDER || 'onboarding@resend.dev';

    console.log(`[DIAGNOSTIC] RESEND_API_KEY exists server-side: ${hasApiKey}`);
    console.log(`[DIAGNOSTIC] Verified sender email in use: ${senderEmail}`);

    if (!hasApiKey) {
      console.error('[DIAGNOSTIC] ERROR: RESEND_API_KEY is missing or empty in server environment variables.');
      return NextResponse.json({ 
        success: false, 
        error: 'Resend API key is not configured on the server. Please add RESEND_API_KEY to your Vercel Environment Variables.' 
      }, { status: 500 });
    }

    console.log('[DIAGNOSTIC] Attempting Resend API email dispatch...');

    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: senderEmail,
      to: email.trim(),
      subject: 'Your OKX FLIX verification code',
      text: `OKX FLIX\n\nYour verification code is:\n\n${otp}\n\nThis code expires in 30 seconds.\n\nIf you did not request this code, you can ignore this email.`
    });

    if (error) {
      console.error('[DIAGNOSTIC] Resend API error response:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message || 'Failed to send email through Resend.' 
      }, { status: 502 });
    }

    console.log('[DIAGNOSTIC] Resend successfully accepted email request. Email ID:', data?.id || 'unknown');

    // Return success without ever exposing or returning the OTP code to the client
    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
      expiresIn: 30
    });

  } catch (err: any) {
    console.error('[DIAGNOSTIC] Exception in send-otp API:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
