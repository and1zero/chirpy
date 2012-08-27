
# CA Expo

  The application for CA

## Building

Important notice:
- Before setup, we have to have nodeJS and npm installed as well. Instructions can be found here: https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager
- Before setup, we must install couchdb on the server. The file has been included in build-couchdb folder and we must follow this link for instruction: https://github.com/iriscouch/build-couchdb/

Setup:

```
source_codes$ npm install
```

then start the server:

```
source_codes$ node app
```

All dependencies are listed under package.json

## Contributing

  - __dont__ edit the HTML directly, edit the _jade_.
