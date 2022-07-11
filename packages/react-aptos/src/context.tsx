import type { UseSeacliffArgs } from "@aptosis/seacliff";
import { SeacliffProvider } from "@aptosis/seacliff";

import type { AptosEventHandlers } from "./index.js";
import { AptosEventHandlersProvider } from "./index.js";
import { ReactOmniProvider } from "./omni/context.js";

/**
 * Arguments for the Aptos client.
 */
export type UseAptosArgs = UseSeacliffArgs & AptosEventHandlers;

interface Props extends UseAptosArgs {
  children?: React.ReactNode;
}

export const AptosProvider: React.FC<Props> = ({
  children,
  onTXRequest,
  onTXSend,
  onTXSuccess,
  onTXRevertError,
  ...args
}: Props) => {
  return (
    <SeacliffProvider {...args}>
      <AptosEventHandlersProvider
        initialState={{
          onTXRequest,
          onTXSend,
          onTXSuccess,
          onTXRevertError,
        }}
      >
        <ReactOmniProvider>{children}</ReactOmniProvider>
      </AptosEventHandlersProvider>
    </SeacliffProvider>
  );
};
