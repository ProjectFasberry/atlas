import type { Atom } from "@reatom/framework";
import { useAtom } from "@reatom/npm-solid-js";
import { clsx, type ClassValue } from "cnfast";
import { twMerge } from "cnfast";
import type { Accessor } from "solid-js";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const useAtomAccessor = <T>(atom: Atom<T>): Accessor<T> => useAtom(atom)[0]