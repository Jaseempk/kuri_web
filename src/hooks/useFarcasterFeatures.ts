import { useFarcaster } from "../contexts/FarcasterContext";
import React from "react";

export function useFarcasterFeatures() {
  const { isInFarcaster, context } = useFarcaster();

  const adaptToFarcaster = (component: React.ReactNode) => {
    if (!isInFarcaster) return component;

    return React.createElement(
      "div",
      { className: "farcaster-adapted" },
      component
    );
  };

  return {
    isInFarcaster,
    context,
    adaptToFarcaster,
  };
}
