const DEFAULT_SOFT_DELAY = 300
const DIALOG_DELAY = 300
const ALERT_DIALOG_DELAY = 150

const ENVIRONMENT = typeof window === 'undefined' ? "server" : "client"

export {
  DIALOG_DELAY,
  DEFAULT_SOFT_DELAY,
  ALERT_DIALOG_DELAY,
  ENVIRONMENT,
}
