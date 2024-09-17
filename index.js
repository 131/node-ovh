'use strict';

const url     = require('url');
const querystring = require('querystring');

const request  = require('nyks/http/request');
const sha1    = require('nyks/crypto/sha1');
const drain   = require('nyks/stream/drain');




class Ovh {

  constructor(params = {}) {

    this.appKey = params.appKey        || process.env['OVH_APPLICATION_KEY'];
    this.appSecret = params.appSecret  || process.env['OVH_APPLICATION_SECRET'];
    this.consumerKey = params.consumerKey  || process.env['OVH_CONSUMER_KEY'];

    this.timeout = params.timeout;
    this.apiTimeDiff = params.apiTimeDiff || null;

    // Custom configuration of the API endpoint
    this.host = params.host || 'eu.api.ovh.com';
    this.basePath = params.basePath || '/1.0';

    if(typeof (this.appKey) !== 'string' || typeof (this.appSecret) !== 'string')
      throw new Error('[OVH] You should precise an application key / secret');
  }


  static build(params = {}) {
    return new Ovh(params);
  }


  async request(method, path, params = {}) {


    // Time drift
    if(!this.apiTimeDiff) {
      let req = await request('https://' + this.host + this.basePath  + '/auth/time');
      let time = JSON.parse(await drain(req));

      this.apiTimeDiff = time - Math.round(Date.now() / 1000);
    }

    if(path.indexOf('{') != -1) {
      let newPath = path;
      for(let paramKey in params) {
        if(Object.hasOwn(params, paramKey)) {
          newPath = path.replace('{' + paramKey + '}', params[paramKey]);
          if(newPath !== path)
            delete params[paramKey];
          path = newPath;
        }
      }
    }


    let query = Object.assign(url.parse('https://' + this.host + this.basePath + path), {
      method,
      headers : {
        'Content-Type' : 'application/json',
        'X-Ovh-Application' : this.appKey,
      }
    });

    // Remove undefined values
    for(let k in params) {
      if(params[k] == undefined)
        delete params[k];
    }

    let reqBody = "";

    if(typeof (params) === 'object' && Object.keys(params).length > 0) {
      if(method === 'PUT' || method === 'POST') {
        // Escape unicode
        reqBody = JSON.stringify(params).replace(/[\u0080-\uFFFF]/g, (m) => {
          return '\\u' + ('0000' + m.charCodeAt(0).toString(16)).slice(-4);
        });


        query.headers['Content-Length'] = reqBody.length;
      }
      else {
        query.search = '?' + querystring.stringify(params); // used by url.format, for signature
      }
    }

    var endpoint = url.format(query);

    if(path.indexOf('/auth') == -1) {
      query.headers['X-Ovh-Timestamp'] = Math.round(Date.now() / 1000) + this.apiTimeDiff;

      // Sign request
      if(typeof (this.consumerKey) === 'string') {
        query.headers['X-Ovh-Consumer'] = this.consumerKey;
        query.headers['X-Ovh-Signature'] = this.signRequest(
          method, endpoint,
          reqBody, query.headers['X-Ovh-Timestamp']
        );
      }
    }

    try {
      let req = await request(query, reqBody);
      let body = await drain(req);

      if(req.statusCode != 200)
        throw Object.assign(new Error(`Invalid response code`), {code : req.statusCode, body  : String(body)});

      var response = JSON.parse(body);
      return response;
    } catch(err) {
      throw Object.assign(new Error(`API failure for ${path}`), {source : err});
    }
  }


  signRequest(httpMethod, endpoint, body, timestamp) {
    return '$1$' + sha1([
      this.appSecret,
      this.consumerKey,
      httpMethod,
      endpoint,
      body || '',
      timestamp
    ].join('+'));
  }

}

module.exports = Ovh;
