import type { UseAptosConnectionArgs } from "./index.js";
import { AptosConnectionProvider } from "./index.js";
import { ReactOmniProvider } from "./omni/context.js";

/**
 * Arguments for the Aptos client.
 */
export type UseAptosArgs = UseAptosConnectionArgs;

interface Props extends UseAptosArgs {
  children?: React.ReactNode;
}

export const AptosProvider: React.FC<Props> = ({
  children,
  ...args
}: Props) => {
  return (
    <AptosConnectionProvider initialState={args}>
      <ReactOmniProvider>{children}</ReactOmniProvider>
    </AptosConnectionProvider>
  );
};
