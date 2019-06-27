"use strict";

const { getPolyfillString } = require("polyfill-library");
const headers = require("./src/headers");
const defaultFeatures = require("./src/features");

const makePolyfill = ({ uaString, cache, features }) => (
  getPolyfillString({ uaString, minify: cache, features, unknown: "polyfill" })
    .then(polyfill => {
      const polyfillHeaders = {
        ...headers,
        "Cache-Control": cache ? "max-age=31536000" : "no-cache",
        "Content-Type": "application/javascript;charset=utf-8"
      };

      return {
        status: 200,
        statusDescription: "OK",
        headers: Object.keys(polyfillHeaders).reduce(
          (accum, key) => ({ ...accum, [key]: [{ key, value: polyfillHeaders[key] }] }), {}
        ),
        body: polyfill
      };
    })
);

const handle = (event, context, callback) => {
  const request = event.Records[0].cf.request;
  const uaString = request.headers["user-agent"][0].value;
  let features = defaultFeatures;
  if (request.querystring && request.querystring.includes('?features=')) {
    features = {};
    request.querystring.split("?features=")[1].split("&").map(str => features[str] = {});
  }

  makePolyfill({ uaString, cache: true, features })
    .then(response => callback(null, response))
    .catch(callback)
};

module.exports = { makePolyfill, handle };
