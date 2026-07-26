"use client";

import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState(""); // honeypot — left empty by real users
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message, companyWebsite }),
    });

    if (res.ok) {
      setStatus("sent");
      setName("");
      setEmail("");
      setMessage("");
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <p className="text-sm text-green-700">Thanks — your message has been sent.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm">
      {/* Hidden from real users via CSS, not `type="hidden"` — some bots
          skip inputs marked hidden but still fill visually-hidden ones. */}
      <input
        type="text"
        value={companyWebsite}
        onChange={(e) => setCompanyWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px]"
        aria-hidden="true"
      />
      <input
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border border-ink/15 rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-graphite transition-colors"
        required
      />
      <input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-ink/15 rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-graphite transition-colors"
        required
      />
      <textarea
        placeholder="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="border border-ink/15 rounded-md px-3 py-2 text-sm bg-transparent focus:outline-none focus:border-graphite transition-colors"
        required
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="self-start bg-ink text-paper px-5 py-2.5 rounded-md text-sm tracking-wide hover:bg-ink/90 transition-colors disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
