import { Injectable } from '@nestjs/common';
import * as https from 'https';
import EmailPassword from 'supertokens-node/recipe/emailpassword'


@Injectable()
export class PhoneAuthService {
  private requestIdStore: Record<string, string> = {} // phone -> requestId

  private telegramRequest(endpoint: string, body: object): Promise<any> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body)
      const options = {
        hostname: 'gatewayapi.telegram.org',
        path: `/${endpoint}`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TELEGRAM_GATEWAY_TOKEN!}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      }
      const req = https.request(options, (res) => {
        let responseData = ''
        res.on('data', (chunk) => responseData += chunk)
        res.on('end', () => {
          try { resolve(JSON.parse(responseData)) }
          catch (e) { reject(new Error('Failed to parse Telegram response')) }
        })
      })
      req.on('error', reject)
      req.write(data)
      req.end()
    })
  }

  async sendOtp(phone: string) {
    if (process.env.MOCK_OTP === 'true') {
      const mockOtp = Math.floor(1000 + Math.random() * 9000).toString()
      this.requestIdStore[phone] = 'mock-request-id'
      console.log(`[MOCK OTP] Phone: ${phone}, OTP: ${mockOtp}`)
      return { status: 'OK' }
    }

    const data = await this.telegramRequest('sendVerificationMessage', {
      phone_number: phone,
      ttl: 60,
      code_length: 4,
    })

    if (!data.ok) {
      return { status: 'ERROR', message: data.error }
    }

    this.requestIdStore[phone] = data.result.request_id
    return { status: 'OK' }
  }

  async verifyOtpAndSignup(phone: string, password: string, otp: string) {
    const requestId = this.requestIdStore[phone]
    if (!requestId) {
      return { status: 'ERROR', message: 'No OTP sent for this phone number' }
    }
    if (process.env.MOCK_OTP === 'true') {
      // skip Telegram verification in mock mode
    } else {
      const verifyData = await this.telegramRequest('checkVerificationStatus', {
        request_id: requestId,
        code: otp,
      })
  
      const status = verifyData?.result?.verification_status?.status
      if (status !== 'code_valid') {
        return { status: 'ERROR', message: 'Invalid OTP' }
      }
    }
    const email = `${phone}@phone.com`
    const response = await EmailPassword.signUp('public', email, password)
    
    if (response.status !== 'OK') {
      return { status: 'ERROR', message: 'Failed to create account' }
    }

    // cleanup
    delete this.requestIdStore[phone]

    return { status: 'OK', userId: response.user.id }
  }
  
  async signIn(phone: string, password: string) {
    const email = `${phone}@phone.com`
    const response = await EmailPassword.signIn('public', email, password)
    
    if (response.status !== 'OK') {
      return { status: 'ERROR', message: 'Invalid phone or password' }
    }
  
    return { 
      status: 'OK',
      recipeUserId: response.user.loginMethods[0].recipeUserId
    }
  }  
}