/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-b1bafff1'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "402b66900e731ca748771b6fc5e7a068"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "2c918768fc4127f6d9872406aee0e636"
  }, {
    "url": "pwa-512x512.png",
    "revision": "c8a56f0f3adf4f85a12d04b43e2e2392"
  }, {
    "url": "pwa-192x192.png",
    "revision": "648069ca37b3fb7262582c2e9bcd5297"
  }, {
    "url": "index.html",
    "revision": "1886a6f596d57d3875c1fde70568b2e4"
  }, {
    "url": "icon.svg",
    "revision": "f73a092d317f3688d8e31387566476ee"
  }, {
    "url": "favicon-32x32.png",
    "revision": "9a94f9b7830b94e2786791cf8e42a103"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "ea6761010eb83fe85c9a01999a1dea98"
  }, {
    "url": "assets/index-BT2Bovqv.js",
    "revision": null
  }, {
    "url": "assets/index-7Y_IJ2Zk.css",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "ea6761010eb83fe85c9a01999a1dea98"
  }, {
    "url": "favicon-32x32.png",
    "revision": "9a94f9b7830b94e2786791cf8e42a103"
  }, {
    "url": "icon.svg",
    "revision": "f73a092d317f3688d8e31387566476ee"
  }, {
    "url": "pwa-192x192.png",
    "revision": "648069ca37b3fb7262582c2e9bcd5297"
  }, {
    "url": "pwa-512x512.png",
    "revision": "c8a56f0f3adf4f85a12d04b43e2e2392"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "2c918768fc4127f6d9872406aee0e636"
  }, {
    "url": "manifest.webmanifest",
    "revision": "b68053af4db33b93751c3c029ad874e3"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 40,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/images\.unsplash\.com\/.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "unsplash-images-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
