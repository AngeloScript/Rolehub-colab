import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { validateSysConfig } from "./internal/sys-config";

// Initialize System Configuration
validateSysConfig();

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
