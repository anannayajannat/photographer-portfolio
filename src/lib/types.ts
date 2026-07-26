export interface PublicAsset {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  pricingMode: "FREE" | "PAID";
  priceCents: number;
  previewUrl: string;
  downloadCount: number;
  featured: boolean;
  createdAt: string;
}
