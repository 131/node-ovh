This is an es7 async/await designed wrapper of OVH API.
The easiest way to use the [OVH.com](http://ovh.com) APIs in your [node.js](http://nodejs.org/) applications.

[![NPM Version](https://img.shields.io/npm/v/ovh-es.svg?style=flat)](https://www.npmjs.org/package/ovh-es)
[![Build Status](https://img.shields.io/travis/131/node-ovh.svg?style=flat)](http://travis-ci.org/131/node-ovh)
[![Coverage Status](https://img.shields.io/coveralls/131/node-ovh.svg?style=flat)](https://coveralls.io/r/131/node-ovh?branch=master)



```js
// Create your first application tokens here: https://api.ovh.com/createToken/?GET=/me
var ovh = require('ovh-es')({
  appKey: process.env.APP_KEY,
  appSecret: process.env.APP_SECRET,
  consumerKey: process.env.CONSUMER_KEY
});

var me = await ovh.request('GET', '/me');
console.log(err || 'Welcome ' + me.firstname);
```


# Installation

```bash
$ npm install ovh-es
```


# Services (wrapper)
## object-store
```
"use strict";

const fs = require('fs');
const OVHStorage = require('ovh-es/services/object-store');
const pipe = require('nyks/stream/pipe');
const config = require('./credentials');


class foo {
  async run(){
    var storage = new OVHStorage(config);
    // init token
    var ctx = await storage.getCtx();

    var files = await storage.toggleMode(ctx, 'mediaprivate', ".r:*,.rlistings");
    var headers = await storage.showContainer(ctx, 'mediaprivate');


    var remote = await storage.putFile(ctx, 'boucs.jpg', 'mediaprivate/bouc.jpg');
    var local = fs.createWriteStream('tmp.jpg');

    var remote = storage.download(ctx, 'mediaprivate/bouc.jpg');

    await pipe(remote, local);

    var remote = await storage.deleteFile(ctx, 'mediaprivate/bouc.jpg');

    var files = await storage.getFileList(ctx, 'mediaprivate');
    console.log({files, remote});
  }
}


module.exports = foo;
```


