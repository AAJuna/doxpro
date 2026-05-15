import type { LogoSize } from "@/types";

export const LOGO_DIMENSIONS: Record<LogoSize, { width: number; height: number }> = {
  S: { width: 70, height: 35 },
  M: { width: 110, height: 55 },
  L: { width: 160, height: 80 },
  XL: { width: 220, height: 110 },
};

export function logoBox(size: LogoSize | undefined, fallback: LogoSize = "M") {
  return LOGO_DIMENSIONS[size ?? fallback];
}
