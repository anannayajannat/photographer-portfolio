import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // Fail loudly at boot rather than silently at checkout time.
  console.warn("STRIPE_SECRET_KEY is not set — checkout routes will fail.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20",
});
