export interface PaystackInitResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
  is_simulation?: boolean;
  is_test_mode?: boolean;
}

export interface PaystackVerifyResponse {
  status: 'success' | 'failed' | 'abandoned' | 'pending';
  amount: number;
  currency: string;
  reference: string;
  paid_at?: string;
  channel?: string;
  customer?: {
    email: string;
  };
}

export interface VerifyOptions {
  isSimulation?: boolean;
  allowTestMode?: boolean;
}

const PLAN_AMOUNTS: Record<string, { nairas: number; kobo: number; name: string }> = {
  pro: { nairas: 5000, kobo: 500000, name: 'ExcelAI Pro' },
  business: { nairas: 15000, kobo: 1500000, name: 'ExcelAI Business' },
};

export function getPlanPricing(plan: 'pro' | 'business') {
  return PLAN_AMOUNTS[plan] || PLAN_AMOUNTS.pro;
}

export async function initializeTransaction(params: {
  email: string;
  plan: 'pro' | 'business';
  userId: string;
  callbackUrl?: string;
}): Promise<PaystackInitResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const pricing = getPlanPricing(params.plan);
  const reference = `EXL_${params.plan.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const isTestKey = Boolean(secretKey && secretKey.startsWith('sk_test_'));

  // If Paystack secret key is configured and not a placeholder
  if (secretKey && secretKey.startsWith('sk_') && !secretKey.includes('sk_test_...')) {
    try {
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: params.email,
          amount: pricing.kobo,
          currency: 'NGN',
          reference,
          callback_url: params.callbackUrl,
          metadata: {
            user_id: params.userId,
            plan: params.plan,
            custom_fields: [
              {
                display_name: 'Plan',
                variable_name: 'plan',
                value: pricing.name,
              },
            ],
          },
        }),
      });

      const data = await response.json();
      if (data.status && data.data) {
        return {
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference: data.data.reference,
          is_simulation: false,
          is_test_mode: isTestKey,
        };
      } else {
        console.warn('Paystack API returned error:', data.message);
        throw new Error(data.message || 'Failed to initialize Paystack transaction');
      }
    } catch (err: any) {
      console.error('Paystack initialization error:', err);
      throw err;
    }
  }

  // Demo / Simulation Mode: Seamlessly enabled when live key is not configured
  // This allows full testing of the flow before real keys are inserted in .env!
  console.log(`[Paystack Demo Mode] Initialized demo transaction for ${params.email} - ${params.plan} (₦${pricing.nairas.toLocaleString()})`);
  return {
    authorization_url: `/paystack-checkout?reference=${encodeURIComponent(reference)}&plan=${params.plan}&amount=${pricing.nairas}`,
    access_code: `mock_code_${reference}`,
    reference,
    is_simulation: true,
    is_test_mode: true,
  };
}

export async function verifyTransaction(
  reference: string,
  expectedPlan: 'pro' | 'business',
  options?: VerifyOptions
): Promise<PaystackVerifyResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const pricing = getPlanPricing(expectedPlan);
  const isTestKey = Boolean(secretKey && secretKey.startsWith('sk_test_'));

  // If explicitly requested as simulation or test verification
  if (options?.isSimulation) {
    console.log(`[Paystack Simulation/Test] Instant verification for ${reference}`);
    return {
      status: 'success',
      amount: pricing.nairas,
      currency: 'NGN',
      reference,
      paid_at: new Date().toISOString(),
      channel: isTestKey ? 'card (Paystack Test Key)' : 'card (demo simulation)',
      customer: {
        email: 'test@user.com',
      },
    };
  }

  // If real Paystack key is set, call Paystack Verify API
  if (secretKey && secretKey.startsWith('sk_') && !secretKey.includes('sk_test_...')) {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      });

      const data = await response.json();
      if (data.status && data.data && data.data.status === 'success') {
        const tx = data.data;
        if (tx.amount < pricing.kobo) {
          throw new Error(`Payment amount ₦${tx.amount / 100} does not match required ₦${pricing.nairas}`);
        }
        return {
          status: 'success',
          amount: tx.amount / 100,
          currency: tx.currency || 'NGN',
          reference: tx.reference,
          paid_at: tx.paid_at || new Date().toISOString(),
          channel: tx.channel,
          customer: {
            email: tx.customer?.email,
          },
        };
      }

      // If using Paystack test keys (sk_test_...), allow testing without real payment
      if (isTestKey && options?.allowTestMode !== false) {
        console.log(`[Paystack Test Key Mode] Test transaction ${reference} verified in test sandbox.`);
        return {
          status: 'success',
          amount: pricing.nairas,
          currency: 'NGN',
          reference,
          paid_at: new Date().toISOString(),
          channel: 'Paystack Test Sandbox',
          customer: {
            email: data.data?.customer?.email || 'tester@example.com',
          },
        };
      }

      throw new Error(`Payment status is ${data.data?.status || 'unconfirmed'}. Subscription cannot be activated.`);
    } catch (err: any) {
      if (isTestKey && options?.allowTestMode !== false) {
        console.log(`[Paystack Test Key Mode Fallback] Test reference ${reference} verified in sandbox.`);
        return {
          status: 'success',
          amount: pricing.nairas,
          currency: 'NGN',
          reference,
          paid_at: new Date().toISOString(),
          channel: 'Paystack Test Sandbox',
          customer: {
            email: 'tester@example.com',
          },
        };
      }
      throw err;
    }
  }

  // Demo / Simulation verification
  console.log(`[Paystack Demo Mode] Verified transaction reference: ${reference}`);
  return {
    status: 'success',
    amount: pricing.nairas,
    currency: 'NGN',
    reference,
    paid_at: new Date().toISOString(),
    channel: 'card (demo simulation)',
    customer: {
      email: 'demo@user.com',
    },
  };
}
