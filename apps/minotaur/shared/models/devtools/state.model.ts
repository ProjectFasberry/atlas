import { devtoolsConfig } from "./config";

const DEVTOOLS_DATA_LS_KEY = "devtools-data"

type NestedKeys<T> = T extends { value: any; __meta: any }
  ? never
  : { [K in keyof T & string]: T[K] extends object
    ? `${K}.${NestedKeys<T[K]>}` | K
    : K;
  }[keyof T & string];

export type DevtoolsCookieChildKey = Exclude<
  NestedKeys<typeof devtoolsConfig>,
  "value" | "__meta" | `${string}.value` | `${string}.__meta`
>;
export type DevtoolsCoords = { x: number, y: number, w: number, h: number };

const setDeep = (obj: any, path: string[], value: any): any => {
  const [head, ...tail] = path;
  if (!head) return value;

  const current = (obj && typeof obj === 'object') ? obj[head] : {};
  return {
    ...obj,
    [head]: tail.length > 0 ? setDeep(current, tail, value) : value
  };
};

export const devtoolsData = {
  key: DEVTOOLS_DATA_LS_KEY,
  _parse(): Record<string, any> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error("Devtools parse error:", e);
      return {};
    }
  },
  getAll<T>(): T | null {
    const data = this._parse();
    return Object.keys(data).length > 0 ? (data as T) : null;
  },
  get<T>(path: DevtoolsCookieChildKey): T | null {
    const data = this._parse();
    const result = path.split('.').reduce((acc, part) => acc?.[part], data);
    return (result as T) ?? null;
  },
  setAll<T>(value: object): T | null {
    try {
      const stringified = JSON.stringify(value);
      localStorage.setItem(this.key, stringified);
      return JSON.parse(stringified) as T;
    } catch (e) {
      console.error("Devtools save error:", e);
      return null;
    }
  },
  set(path: DevtoolsCookieChildKey, value: any): any {
    if (value instanceof Map) return null;

    const currentData = this._parse();
    const newData = setDeep(currentData, path.split('.'), value);
    return this.setAll(newData);
  },
  clear() {
    localStorage.removeItem(this.key);
  }
};
