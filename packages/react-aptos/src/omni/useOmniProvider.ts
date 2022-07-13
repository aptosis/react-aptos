import type { OmniProvider } from "@omnimask/provider-interface";
import { OMNI_READY_EVENT } from "@omnimask/provider-interface";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    omni?: OmniProvider;
  }
}

/**
 * Loads the Omni provider. Internal use only.
 *
 * @returns
 */
export const useOmniProviderInternal = (): OmniProvider | null | undefined => {
  const [provider, setProvider] = useState<OmniProvider | null | undefined>(
    undefined
  );
  useEffect(() => {
    if (window.omni) {
      setProvider(window.omni);
    } else {
      const listener = () => {
        setProvider(window.omni);
      };
      window.addEventListener(OMNI_READY_EVENT, listener);
      return () => {
        window.removeEventListener(OMNI_READY_EVENT, listener);
      };
    }
  }, []);
  return provider;
};
