"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function AlertSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Subscription failed");
      }
      setStatus("success");
      setMessage("You're subscribed. We'll email you when gold moves ±1%.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  async function handleUnsubscribe() {
    if (!email) return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Unsubscribe failed");
      }
      setStatus("success");
      setMessage("You've been unsubscribed from price alerts.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  return (
    <div className="border-t border-gray-100 pt-8">
      <h2 className="text-xs tracking-widest uppercase text-gray-400 mb-1">Price Alerts</h2>
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
        Receive an email when gold moves more than 1% up or down within an hour.
      </p>

      <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 border border-gray-300 px-4 py-2.5 text-sm bg-white text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
          disabled={status === "loading"}
        />
        <button
          type="submit"
          disabled={status === "loading" || !email}
          className="px-6 py-2.5 bg-black text-white text-xs tracking-widest uppercase hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {status === "loading" ? "…" : "Subscribe"}
        </button>
        <button
          type="button"
          onClick={handleUnsubscribe}
          disabled={status === "loading" || !email}
          className="px-6 py-2.5 border border-gray-300 text-black text-xs tracking-widest uppercase hover:border-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Unsubscribe
        </button>
      </form>

      {message && (
        <p
          className={`mt-3 text-xs tracking-wide ${
            status === "success" ? "text-green-600" : "text-red-500"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
