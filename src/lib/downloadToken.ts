import jwt from "jsonwebtoken";

const SECRET = process.env.DOWNLOAD_TOKEN_SECRET ?? "dev-only-insecure-secret";

interface TokenPayload {
  orderId: string;
  assetId: string;
}

/** Issued only after a Stripe webhook confirms payment. Expires in 1 hour. */
export function issueDownloadToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "1h" });
}

export function verifyDownloadToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
