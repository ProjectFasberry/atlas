const DEFAULT_SOFT_DELAY = 300
const DIALOG_DELAY = 300
const ALERT_DIALOG_DELAY = 150

const ENVIRONMENT = typeof window === 'undefined' ? "server" : "client"

// todo: fetch dynamically
const DONATE_COLORS: Record<string, string> = {
  "arkhont": "#30ff5d",
  "authentic": "#e342cd",
  "loyal": "#40c983",
  "default": "#FFFFFF",
  "helper": "#3D3D3D",
  "dev": "#A1A1A1",
  "moder": "#6452d9",
} as const;

export {
  DIALOG_DELAY,
  DEFAULT_SOFT_DELAY,
  ALERT_DIALOG_DELAY,
  ENVIRONMENT,
  DONATE_COLORS,
}
