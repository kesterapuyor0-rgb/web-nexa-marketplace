import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

export const FlutterwaveVerification = () => {
  const [params] = useSearchParams();
  const { token } = useAuth();
  const { clearCart } = useCart();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your payment with Flutterwave…");
  const txRef = params.get("tx_ref") || params.get("reference");
  const transactionId = params.get("transaction_id");
  const providerStatus = params.get("status");

  useEffect(() => {
    if (!txRef || !transactionId) {
      setStatus("error");
      setMessage("Flutterwave did not return a transaction reference and ID.");
      return;
    }
    if (providerStatus && providerStatus !== "successful") {
      setStatus("error");
      setMessage("Payment was not completed. No order has been created.");
      return;
    }
    const query = new URLSearchParams({ tx_ref: txRef, transaction_id: transactionId });
    fetch(`/api/checkout/verify?${query}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Payment verification failed.");
        clearCart();
        setStatus("success");
        setMessage(`Payment verified and held for order ${data.order.order_number}.`);
      })
      .catch((error) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Payment verification failed.");
      });
  }, [txRef, transactionId, providerStatus, token]);

  return <main className="flex min-h-[70vh] items-center justify-center px-4 py-16">
    <section className="w-full max-w-lg rounded-xl border border-zinc-800 bg-[#16161a] p-8 text-center">
      {status === "loading" && <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-400" />}
      {status === "success" && <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />}
      {status === "error" && <AlertCircle className="mx-auto h-12 w-12 text-red-400" />}
      <h1 className="mt-5 text-2xl font-bold text-white">{status === "success" ? "Payment confirmed" : status === "error" ? "Payment not confirmed" : "Confirming payment"}</h1>
      <p className="mt-3 text-sm text-zinc-400">{message}</p>
      {status !== "loading" && <Link to="/buyer/orders" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-purple-600 px-5 text-sm font-bold text-white">View orders</Link>}
    </section>
  </main>;
};