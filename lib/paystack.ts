import crypto from "crypto";

export function getPaystackSecretKey(): string {
    return (
        process.env.PAYSTACK_TEST_SECRET ||
        process.env.PAYSTACK_SECRET_KEY ||
        process.env.PAYSTACK_SECRET ||
        ""
    );
}

export function getPaystackPublicKey(): string {
    return (
        process.env.PAYSTACK_TEST_PUBLIC ||
        process.env.NEXT_PUBLIC_PAYSTACK_KEY ||
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
        process.env.PAYSTACK_PUBLIC_KEY ||
        ""
    );
}

export interface PaystackInitParams {
    email: string;
    amountInKobo: number;
    reference?: string;
    callbackUrl?: string;
    metadata: {
        userId: string;
        tier: 'DISCIPLE' | 'MINISTER';
        cycle: 'monthly' | 'yearly';
        [key: string]: any;
    };
}

export interface PaystackInitResponse {
    status: boolean;
    message: string;
    data: {
        authorization_url: string;
        access_code: string;
        reference: string;
    };
}

export interface PaystackVerifyResponse {
    status: boolean;
    message: string;
    data: {
        id: number;
        status: 'success' | 'failed' | 'abandoned';
        reference: string;
        amount: number;
        currency: string;
        channel: string;
        paid_at: string;
        customer: {
            id: number;
            customer_code: string;
            email: string;
        };
        metadata: {
            userId?: string;
            user_id?: string;
            tier?: 'DISCIPLE' | 'MINISTER';
            cycle?: 'monthly' | 'yearly';
            [key: string]: any;
        };
    };
}

/**
 * Initialize a transaction with Paystack
 */
export async function initializePaystackTransaction(params: PaystackInitParams): Promise<PaystackInitResponse> {
    const secretKey = getPaystackSecretKey();
    if (!secretKey) {
        throw new Error("Paystack secret key is not configured");
    }

    const payload = {
        email: params.email,
        amount: params.amountInKobo,
        reference: params.reference || `rhema_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        callback_url: params.callbackUrl,
        metadata: params.metadata,
        channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
    };

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
        throw new Error(data.message || `Paystack initialization failed (${res.status})`);
    }

    return data;
}

/**
 * Verify a transaction with Paystack
 */
export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const secretKey = getPaystackSecretKey();
    if (!secretKey) {
        throw new Error("Paystack secret key is not configured");
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json"
        }
    });

    const data = await res.json();
    if (!res.ok || !data.status) {
        throw new Error(data.message || `Paystack verification failed (${res.status})`);
    }

    return data;
}

/**
 * Verify Paystack webhook HMAC signature
 */
export function verifyPaystackSignature(bodyRaw: string, signature: string): boolean {
    const secret = getPaystackSecretKey();
    if (!secret || !signature) return false;

    const hash = crypto.createHmac("sha512", secret).update(bodyRaw).digest("hex");
    return hash === signature;
}
