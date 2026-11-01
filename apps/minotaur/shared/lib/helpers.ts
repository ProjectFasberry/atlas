import { env } from "../env";

export const getApiMiscRoute = (path: string) => `${env.VITE_API_URL}/misc/${path}`;
export const getApiHost = () => new URL(env.VITE_API_URL).hostname;
export const getIsMobile = (ua: string) => /Mobile|Android|iPhone|iPad/i.test(ua);

export const wrapTitle = (i: string) => `Fasberry > ${i}`;

type CreateWs = {
  host: string;
  port?: number | string;
  path?: string;
  isSecure?: boolean;
};
export const createWsUrl = ({
  host, port, path = '', isSecure = true
}: CreateWs): string => {
  const protocol = isSecure ? 'wss' : 'ws';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const portSuffix = port ? `:${port}` : '';
  const cleanHost = host.replace(/\/+$/, '');
  return `${protocol}://${cleanHost}${portSuffix}${cleanPath}`;
};

export const createEs = (path: string, init: EventSourceInit) => {
  return new EventSource(`${env.VITE_API_URL}/${path}`, init)
};

const softwareRenderers = [
  'swiftshader',
  'llvmpipe',
  'software rasterizer',
  'microsoft basic render driver',
  'vmware svga ii',
  'virtualbox graphics adapter'
];

export function detectHardwareAcceleration(): boolean {
  let gl: WebGLRenderingContext | null = null;
  const canvas = document.createElement('canvas');

  try {
    gl = (
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: true })
    ) as WebGLRenderingContext | null;
  } catch (e) {
    return false;
  }
  if (!gl) {
    try {
      gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    } catch (e) {
      return false;
    }
    if (!gl) return false;
  }

  const debugInfo = gl.getExtension('RENDERER');
  let rendererName = '';

  if (debugInfo) {
    rendererName = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || gl.getParameter(gl.RENDERER);
  } else {
    rendererName = gl.getParameter(gl.RENDERER);
  }

  rendererName = rendererName.toLowerCase();

  for (const softwareKeyword of softwareRenderers) {
    if (rendererName.includes(softwareKeyword)) {
      if (import.meta.env.DEV) {
        console.warn(`Potential software WebGL renderer detected: ${rendererName}`);
      }
      return false;
    }
  }

  return true;
}

export function detectMobile(): boolean {
  const nav = navigator as any;

  if (nav.userAgentData?.mobile !== undefined) {
    return nav.userAgentData.mobile;
  }

  const ua = nav.userAgent.toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isIPadOS = ua.includes("macintosh") && nav.maxTouchPoints > 1;

  if (isMobileUA || isIPadOS) {
    try {
      const canvas = document.createElement("canvas");
      const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext;
      if (gl) {
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();

          const isDesktopGPU = /nvidia|intel|amd|swiftshader|microsoft/i.test(renderer);
          if (isDesktopGPU) return false;
        }
      }
    } catch (e) { }

    return true;
  }

  return nav.maxTouchPoints > 0 && !/win32|macintel/i.test(nav.platform || "");
}

const BOT_UA_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /slurp/i,
  /curl/i,
  /wget/i,
  /python-requests/i,
  /axios/i,
] as const;

export function isBotRequest(headers: Record<string, string | undefined>, pathname?: string): boolean {
  const ua = headers['user-agent'] ?? '';
  const accept = headers['accept'] ?? '';
  const referer = headers['referer'] ?? '';

  const isBotUA = BOT_UA_PATTERNS.some((re) => re.test(ua));
  const missingCommonHeaders = !ua || !accept || (!referer && !accept.includes('text/html'));

  const result = isBotUA || missingCommonHeaders;

  if (result && import.meta.env.DEV) {
    if (pathname) {
      console.warn(`Prevented bot request at ${pathname}`);
    }
  }

  return result;
}

const NOT_EXIST_TYPES_ARR = ["player", "land", "store.item", "default"] as const;

export const NOT_EXIST_TYPES: Record<typeof NOT_EXIST_TYPES_ARR[number], string> = {
  "player": "Игрок не найден",
  "land": "Похоже этого региона уже нет",
  "store.item": "Товар не найден",
  "default": "Ресурс не найден"
} as const;

export const getNotExistUrlByEntity = (t?: keyof typeof NOT_EXIST_TYPES): `/not-exist?t=${NonNullable<typeof t>}` => {
  return `/not-exist?t=${t ?? "default"}`
}
export const getNotExistType = (search: Record<string, string>): typeof NOT_EXIST_TYPES_ARR[number] => {
  return NOT_EXIST_TYPES_ARR.find((t) => t === search.t) ?? "default"
}

export const getStaticImage = (target: string) => `${env.VITE_VOLUME_URL}/static/${target}`
export const getObjectUrl = (bucket: string, key: string) => `${env.VITE_VOLUME_URL}/${bucket}/${key}`
