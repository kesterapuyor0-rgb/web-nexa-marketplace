declare module '@paystack/inline-js' {
  interface PaystackTransactionOptions {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref?: string;
    reference?: string;
    onSuccess: (transaction: { reference: string }) => void;
    onCancel?: () => void;
    onClose?: () => void;
  }

  interface ImportMetaEnv {
    readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  export default class PaystackPop {
    newTransaction(options: PaystackTransactionOptions): void;
  }
}
