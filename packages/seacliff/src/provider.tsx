import React from "react";

import type { UseSeacliffArgs } from "./context.js";
import { SeacliffInternalProvider } from "./context.js";

interface Props extends UseSeacliffArgs {
  children?: React.ReactNode;
}

export const SeacliffProvider: React.FC<Props> = ({
  children,
  ...args
}: Props) => {
  return (
    <SeacliffInternalProvider initialState={args}>
      {children}
    </SeacliffInternalProvider>
  );
};
