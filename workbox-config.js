module.exports = {
  "globDirectory": "build/",
  "globPatterns": [
    "**/*.{html,ico,json}",
    "images/*.{jpg,png}",
    "images/icons/*.{jpg,png}",
    "js/*.js",
    "css/*.css"
  ],
  "swDest": "public/service-worker.js",
  "swSrc": "public/sw/sw-base.js",
  "globIgnores": [
    "../workbox-config.js",
 
  ]
};