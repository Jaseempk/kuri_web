import { createContext, useContext, useEffect, useState } from "react";
import type { Context } from "@farcaster/frame-core";
import sdk from "@farcaster/frame-sdk";

type FarcasterContextType = {
  isInFarcaster: boolean;
  context?: Context.FrameContext;
};

const FarcasterContext = createContext<FarcasterContextType>({
  isInFarcaster: false,
});

export const useFarcaster = () => useContext(FarcasterContext);

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        // Dynamically import the SDK to avoid loading it unnecessarily

        const ctx = await sdk.context;

        if (ctx) {
          setIsInFarcaster(true);
          setContext(ctx);
          sdk.actions.ready();
        }
      } catch (error) {
        console.debug("Not in Farcaster environment:", error);
        setIsInFarcaster(false);
      }
    };

    initializeFarcaster();
  }, []);

  return (
    <FarcasterContext.Provider value={{ isInFarcaster, context }}>
      {children}
    </FarcasterContext.Provider>
  );
}
