module.exports = {
  baseDir: "./.next",
  defaultCompression: "gzip",
  subProject: "wiki",
  groups: [
    { path: "static/**/*.js", friendlyName: "client js" },
    { path: "static/**/*.css", friendlyName: "client css" },
    { path: "static/**/*.{woff,woff2,ttf,otf}", friendlyName: "client fonts", compression: "none" },
    { path: "static/**/*.{png,jpg,jpeg,webp,svg,gif,ico}", friendlyName: "client images", compression: "none" },
    { path: "server/**/*.js", friendlyName: "server js" },
  ],
  reportOutput: ["json"],
}
