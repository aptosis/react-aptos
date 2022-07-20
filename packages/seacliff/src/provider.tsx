import type { UseAptosAPIArgs } from "@aptosis/react-aptos-api";
import { AptosAPIProvider } from "@aptosis/react-aptos-api";
import React from "react";

import type { UseSeacliffArgs } from "./context.js";
import { SeacliffInternalProvider } from "./context.js";

interface Props extends UseSeacliffArgs, UseAptosAPIArgs {
  children?: React.ReactNode;
}

export const SeacliffProvider: React.FC<Props> = ({
  children,
  ...args
}: Props) => {
  return (
    <AptosAPIProvider initialState={args}>
      <SeacliffInternalProvider initialState={args}>
        {children}
      </SeacliffInternalProvider>
    </AptosAPIProvider>
  );
};
