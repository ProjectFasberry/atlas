module.exports = {
  baseDir: "./dist",
  defaultCompression: "gzip",
  subProject: "taurus",
  groups: [
    { path: "client/**/*.js", friendlyName: "client js" },
    { path: "client/**/*.css", friendlyName: "client css" },
    { path: "client/**/*.{woff,woff2,ttf,otf}", friendlyName: "client fonts", compression: "none" },
    { path: "client/**/*.{png,jpg,jpeg,webp,svg,gif}", friendlyName: "client images", compression: "none" },
    { path: "server/**/*.js", friendlyName: "server js" },
  ],
  reportOutput: ["json"],
}
