# Resend Email Setup Guide

## Current Status ✅
Your contact form is now working with `onboarding@resend.dev` as the sender. This is Resend's test email that works immediately without domain verification.

## Important Notes:
1. **Emails are being sent to:** admin@triya.ai
2. **Reply-to is set to:** The user's email (so you can reply directly)
3. **Vercel is auto-deploying** your fix right now

## To Use Your Own Domain (triya.ai)

### Step 1: Add Domain to Resend
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Click "Add Domain"
3. Enter `triya.ai`
4. You'll get DNS records to add

### Step 2: Add DNS Records
Add these to your domain provider (where you bought triya.ai):

**For sending from noreply@triya.ai:**
```
Type: MX
Name: send
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
```

**For domain verification:**
```
Type: TXT
Name: _resend
Value: [Resend will provide this]
```

**For DKIM (email authentication):**
```
Type: CNAME
Name: [Resend provides 3 CNAME records]
Value: [Resend provides values]
```

### Step 3: Wait for Verification
- Takes 24-48 hours for DNS propagation
- Resend will show "Verified" when ready

### Step 4: Update Code
Once verified, update `/app/api/contact/route.ts`:

```typescript
// Change from:
from: 'Triya.ai <onboarding@resend.dev>'

// To:
from: 'Triya.ai <noreply@triya.ai>'
```

## Testing Your Current Setup

1. **Go to your Vercel URL:** https://triya-website.vercel.app/contact
2. **Fill the form**
3. **Check admin@triya.ai inbox**
4. **You'll receive:**
   - Main notification email with all details
   - User gets confirmation email

## Troubleshooting

### If emails aren't arriving:
1. Check spam folder
2. Verify RESEND_API_KEY in Vercel dashboard
3. Check Resend dashboard for failed emails
4. Look at Vercel function logs

### Common Issues:
- **"Invalid sender"**: Domain not verified yet, use onboarding@resend.dev
- **"API key invalid"**: Check environment variable in Vercel
- **No emails received**: Check spam, wait 2-3 minutes

## Current Working Flow:
```
User fills form 
→ API sends via onboarding@resend.dev 
→ admin@triya.ai receives email
→ User receives confirmation
→ Reply-to is set to user's email
```

## Next Steps:
1. ✅ Form is working now with test sender
2. ⏳ Add DNS records for triya.ai when ready
3. ⏳ Update sender email after verification
4. ⏳ Consider adding email templates for better formatting

## Support:
- Resend Dashboard: https://resend.com/emails
- Check email status: https://resend.com/emails
- API logs: Vercel Dashboard → Functions → Logs