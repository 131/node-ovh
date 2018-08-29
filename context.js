"use strict";

const url    = require('url');

const get       = require('mout/object/get');
const rtrim     = require('mout/string/rtrim');
const reindex   = require('nyks/collection/reindex');

const promisify = require('nyks/function/promisify');
const request   = promisify(require('nyks/http/request'));
const drain     = require('nyks/stream/drain');


class Context  {

  static async build(credentials) {
    var config = {
      authURL :  'https://auth.cloud.ovh.net/v2.0',
      region :   'GRA3',
      ...credentials
    };

    var json = {
      auth : {
        passwordCredentials : {
          username : config.username,
          password : config.password
        },
        tenantId : config.tenantId
      }
    };

    var query = {
      ...url.parse(config.authURL + '/tokens'),
      headers :  { 'Accept' : 'application/json' },
      json : true,
    };

    var res = await request(query, json);
    var payload = JSON.parse(await drain(res));


    var token           = get(payload, 'access.token');
    var endpoints = get(payload, 'access.serviceCatalog').reduce((full, catalog) => { //, k
      var publicUrl = get(reindex(catalog.endpoints, 'region'), `${config.region}.publicURL`);
      if(publicUrl)
        full[catalog.type]  = rtrim(publicUrl, '/') + '/'; //enforce trailing /
      return full;
    }, {});


    var endpoint = (what, path) => url.resolve(endpoints[what], path);
    var headers  = {
      "X-Auth-Token" : token.id,
      "Accept" : "application/json"
    };

    query = (what, path, xtra) => ({...url.parse(endpoint(what, path)), headers, ...xtra});

    return {token, endpoints, endpoint, headers, query};
  }

}

module.exports = Context;
