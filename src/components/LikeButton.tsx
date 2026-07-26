"use client";

import { useState, useEffect } from "react";

export default function LikeButton({ assetId, initialLikes }: { assetId: string, initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const likedAssets = JSON.parse(localStorage.getItem("liked_assets") || "[]");
    if (likedAssets.includes(assetId)) {
      setIsLiked(true);
    }
  }, [assetId]);

  const toggleLike = async () => {
    const likedAssets = JSON.parse(localStorage.getItem("liked_assets") || "[]");
    const currentlyLiked = likedAssets.includes(assetId);
    
    // Optimistic UI update
    setIsLiked(!currentlyLiked);
    setLikes(prev => currentlyLiked ? prev - 1 : prev + 1);

    // Update LocalStorage
    if (currentlyLiked) {
      const updated = likedAssets.filter((id: string) => id !== assetId);
      localStorage.setItem("liked_assets", JSON.stringify(updated));
    } else {
      likedAssets.push(assetId);
      localStorage.setItem("liked_assets", JSON.stringify(likedAssets));
    }

    // Fire API request
    try {
      await fetch(`/api/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: currentlyLiked ? "unlike" : "like" }),
      });
    } catch (error) {
      console.error("Failed to update like status");
    }
  };

  if (!mounted) return null; // Prevent hydration mismatch

  return (
    <button 
      onClick={toggleLike}
      className="flex items-center gap-1 text-ink/40 text-xs hover:text-ink transition-colors"
      aria-label="Like photo"
    >
      <svg 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill={isLiked ? "currentColor" : "none"} 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {likes}
    </button>
  );
}