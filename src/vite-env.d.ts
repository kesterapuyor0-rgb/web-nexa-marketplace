interface ImportMetaEnv {
  readonly VITE_PAYSTACK_PUBLIC_KEY?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
