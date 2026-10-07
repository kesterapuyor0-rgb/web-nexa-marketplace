const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;

export function getFlutterwavePublicKey() {
  if (!publicKey) {
    throw new Error("Flutterwave public key is not configured.");
  }
  return publicKey;
}
