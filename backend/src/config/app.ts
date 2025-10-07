export const config = {
  port: Number(process.env.PORT || 3001),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  nodeEnv: process.env.NODE_ENV || 'development',
  showErrorStack: process.env.SHOW_ERROR_STACK !== 'false',
  sentryDsn: process.env.SENTRY_DSN,
  flyersAnchorRush: Number(process.env.FLYERS_ANCHOR_RUSH || 104.85),
  flyersAnchorOnline: Number(process.env.FLYERS_ANCHOR_ONLINE || 89.86),
  flyersAnchorPromo: Number(process.env.FLYERS_ANCHOR_PROMO || 41.23),
}
