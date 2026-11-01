import { type Atom, isAtom, type Unsubscribe } from "@reatom/framework";
import { logger } from "./logger";
import { ENVIRONMENT } from "../consts";

export const validateNumber = (input: string): number | null =>
  Number.isFinite(Number(input)) ? Number(input) : null

export const parseBoolean = (str: string | undefined | null): boolean =>
  String(str).toLowerCase() === "true"

export const throttle = <T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number,
) => {
  let isWaiting = false;

  return (...args: T) => {
    if (isWaiting) {
      return;
    }

    callback(...args);
    isWaiting = true;

    setTimeout(() => {
      isWaiting = false;
    }, delay);
  };
};

export const hasSameStructure = <T extends object>(pattern: T, target: unknown): target is T => {
  if (
    typeof pattern !== 'object' || pattern === null ||
    typeof target !== 'object' || target === null
  ) {
    return false;
  }

  const patternKeys = Object.keys(pattern) as Array<keyof T>;

  return patternKeys.every((key) => {
    if (!Object.hasOwn(target, key)) return false;

    const valueP = pattern[key];
    const valueT = (target as any)[key];

    if (typeof valueP === 'object' && valueP !== null && !Array.isArray(valueP)) {
      return hasSameStructure(valueP, valueT);
    }

    return true;
  });
}

export function subscribeOnchange(data: unknown, visited = new Set<unknown>()): Unsubscribe[] {
  if (ENVIRONMENT === 'server') return [];

  const subs: Unsubscribe[] = [];

  if (!data || visited.has(data)) return subs;

  if (Array.isArray(data)) {
    for (const item of data) {
      subs.push(...subscribeOnchange(item, visited));
    }
    return subs;
  }

  if (isAtom(data)) {
    visited.add(data);

    const atom = data as Atom & { [key: string]: unknown };
    const atomName = atom.__reatom.name ?? 'unnamed';

    if ('onChange' in atom && typeof atom.onChange === 'function') {
      const { log } = logger.withTag(atomName)
      log(`Subscribed`);

      const unmemoizedSub = atom.onChange((_, state) => {
        log(state);
      });

      subs.push(unmemoizedSub);
    }

    const keys = Object.getOwnPropertyNames(atom);
    for (const key of keys) {
      const property = atom[key];

      if (isAtom(property) || (typeof property === 'object' && property !== null)) {
        subs.push(...subscribeOnchange(property, visited));
      }
    }
  }

  return subs
}

export const isNullish = <T>(value: T | null | undefined): value is null | undefined => {
  return value === null || value === undefined;
};

export const isMap = <K = any, V = any>(val: unknown): val is Map<K, V> => {
  return val instanceof Map;
};

export function isEmptyArray(data: unknown): boolean {
  return !Array.isArray(data) || data.length === 0;
}

export const isError = (e: unknown): e is Error => {
  return e instanceof Error;
};

export function isEmpty(obj: object): obj is Record<string, never> {
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      return false;
    }
  }
  return true;
}

export function invariant(
  predicate: unknown,
  errorMessage: Error | string = "Assertion Failed"
): asserts predicate {
  if (!predicate) {
    throw typeof errorMessage === "string" ? new Error(errorMessage) : errorMessage;
  }
}

