import { verifySession } from 'supertokens-node/recipe/session/framework/express';
import * as https from 'https';
import { Injectable, Module } from '@nestjs/common';
import * as dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

@Injectable()
export class TelegramGatewayService{
  // key: phone number - string
  // value: object
  private requestIdStore: Record<string, { requestId: string }> = {}; // phone → requestId
  
  private request(endpoint: string, body: object): Promise<any>{ // request 
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(body); // because API only understand strings, not objects.

      const options = { // this is not the logic, it's the configuration
        hostname: 'gatewayapi.telegram.org',
        path: `/${endpoint}`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.TELEGRAM_GATEWAY_TOKEN!}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        }, // this is to build the proper url to reach the correct API
      }

      const req = https.request(options, (res) => { // “Start sending HTTP request to Telegram server”
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(responseData));
          } catch (e) {
            reject(new Error('Failed to parse Telegram response'));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    })
  }

  //getOTP
  async getOTP(phoneNumber: string){
    const data = await this.request('sendVerificationMessage', {
      phone_number: phoneNumber,
      ttl: 60,
      code_length: 4,
    });

    if (!data?.ok) {
      throw new Error(`Telegram OTP failed: ${data?.error || 'Unknown error'}`);
    }

    this.requestIdStore[phoneNumber] = {
      requestId: data.result.request_id,
    };
    return data;
  }

  //verifyOTP
  async verifyOTP(phoneNumber: string, userInputCode: string) {
    const session = this.requestIdStore[phoneNumber];

    if (!session) {
      return { status: 'RESTART_FLOW_ERROR' }; // fix the message
    }

    const verifyData = await this.request('checkVerificationStatus', {
      request_id: session.requestId,
      code: userInputCode,
    });

    console.log('Telegram verify response:', verifyData);
    const status = verifyData?.result?.verification_status?.status;
    
    if (status !== 'code_valid') {
      return {
        status: "INCORRECT_USER_INPUT_CODE_ERROR",
        maximumCodeInputAttempts: 5,
        failedCodeInputAttemptCount: 1,
      };
    }

    return {
      status: 'OK',
      phoneNumber,
    };  
  }

  clear(phoneNumber: string) {
    delete this.requestIdStore[phoneNumber];
  }
}

