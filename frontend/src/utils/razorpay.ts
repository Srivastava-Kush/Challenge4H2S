/**
 * Razorpay frontend utilities.
 * Handles dynamic script loading and payment initialization.
 * The actual Razorpay SDK (@razorpay/razorpay-node) lives server-side only.
 */

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  receipt?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
    hide_topbar?: boolean;
  };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  close(): void;
}

/**
 * Lazily loads the Razorpay Checkout script from the CDN.
 * Returns a promise that resolves when the SDK is ready.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Opens the Razorpay checkout modal.
 * @param orderId   — Razorpay order ID from the backend
 * @param amount    — Amount in paise (INR x 100)
 * @param userInfo  — Pre-fill customer details
 * @param onSuccess — Called with payment response on success
 * @param onDismiss — Called if the user closes the modal
 */
export async function initiateRazorpayPayment({
  orderId,
  amount,
  userInfo,
  onSuccess,
  onDismiss,
}: {
  orderId: string;
  amount: number;
  userInfo: { name?: string; email?: string };
  onSuccess: (response: RazorpayPaymentResponse) => void;
  onDismiss?: () => void;
}): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    throw new Error('Failed to load Razorpay SDK. Please check your internet connection.');
  }

  const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholderkey';

  const options: RazorpayOptions = {
    key: RAZORPAY_KEY,
    amount,
    currency: 'INR',
    name: 'StadiumIQ – FIFA World Cup 2026',
    description: 'Stadium Food Order',
    order_id: orderId,
    prefill: {
      name: userInfo.name,
      email: userInfo.email,
    },
    theme: {
      color: '#0ea5e9',
      hide_topbar: false,
    },
    handler: onSuccess,
    modal: {
      ondismiss: onDismiss,
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
}
