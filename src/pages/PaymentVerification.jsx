import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
export const PaymentVerification = () => {
  const [params] = useSearchParams();
  const { token } = useAuth();
  const { clearCart } = useCart();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your Paystack payment...");
  const reference = params.get("reference");
  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setMessage("No Paystack transaction reference was supplied.");
      return;
    }
    fetch(`/api/payments/verify-paystack?reference=${encodeURIComponent(reference)}`, {
      headers: { Authorization: "Bearer " + token }
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Payment verification failed.");
      clearCart();
      setStatus("success");
      setMessage(`Payment verified for order ${data.order.order_number}.`);
    }).catch((error) => {
      setStatus("error");
      setMessage(error.message);
    });
  }, [reference, token, clearCart]);
  return <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <section className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-[#16161a] p-8 text-center shadow-2xl">
        {status === "loading" && <Loader2 className="mx-auto h-12 w-12 animate-spin text-purple-400" />}
        {status === "success" && <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />}
        {status === "error" && <AlertCircle className="mx-auto h-12 w-12 text-red-400" />}
        <h1 className="mt-5 text-2xl font-bold text-white">{status === "success" ? "Payment confirmed" : status === "error" ? "Payment verification failed" : "Confirming payment"}</h1>
        <p className="mt-3 text-sm text-zinc-400">{message}</p>
        {status !== "loading" && <Link to="/buyer/orders" className="mt-6 inline-flex rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white">View buyer orders</Link>}
      </section>
    </main>;
};
