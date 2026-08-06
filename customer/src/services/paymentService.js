import { PAYMENT_METHODS } from '../constants';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function formatCardNumber(value) {
  return digitsOnly(value)
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();
}

export function formatCardExpiry(value) {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatCvv(value) {
  return digitsOnly(value).slice(0, 4);
}

/**
 * Client-side payment validation until a real gateway is wired.
 */
export async function processPayment({
  method,
  amount,
  cardName,
  cardNumber,
  cardExpiry,
  cardCvv,
  walletPhone,
}) {
  await wait(450);

  if (method === PAYMENT_METHODS.CASH) {
    return {
      status: 'pending_cod',
      method,
      amount,
      message: 'Pay cash to the rider on delivery.',
    };
  }

  if (method === PAYMENT_METHODS.CARD) {
    const number = digitsOnly(cardNumber);
    if (!String(cardName || '').trim()) {
      throw new Error('Enter the name on your card.');
    }
    if (number.length < 12 || number.length > 16) {
      throw new Error('Enter a valid 12–16 digit card number.');
    }
    if (!/^\d{2}\/\d{2}$/.test(String(cardExpiry || '').trim())) {
      throw new Error('Enter expiry as MM/YY.');
    }
    const [mm] = String(cardExpiry).split('/');
    if (Number(mm) < 1 || Number(mm) > 12) {
      throw new Error('Enter a valid expiry month.');
    }
    if (!/^\d{3,4}$/.test(digitsOnly(cardCvv))) {
      throw new Error('Enter a valid CVV.');
    }

    return {
      status: 'paid',
      method,
      amount,
      cardLast4: number.slice(-4),
      message: 'Card payment authorized.',
    };
  }

  if (method === PAYMENT_METHODS.ONLINE) {
    const phone = digitsOnly(walletPhone);
    if (phone.length < 10) {
      throw new Error('Enter a valid JazzCash / EasyPaisa number.');
    }

    return {
      status: 'paid',
      method,
      amount,
      walletPhone: phone,
      message: 'Wallet payment confirmed.',
    };
  }

  throw new Error('Select a payment method.');
}
