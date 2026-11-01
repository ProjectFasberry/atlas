import { clsx, type ClassValue } from "cnfast";
import { twMerge } from "cnfast";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
