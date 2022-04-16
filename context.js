"use strict";

const url    = require('url');

const dive      = require('nyks/object/dive');

const rtrim     = require('mout/string/rtrim');
const reindex   = require('nyks/collection/reindex');

const request   = require('nyks/http/request');
const drain     = require('nyks/stream/drain');

const debug  = require('debug');

const log = {
  debug : debug('ovh-es:debug'),
  info  : debug('ovh-es:info'),
  error : debug('ovh-es:error'),
};



class Context  {

  static async build(credentials) {
    var config = {
      authURL :  'https://auth.cloud.ovh.net/v3',
      region :   'GRA',
      ...credentials
    };

    var json = { auth : {
      identity : {
        methods : ['password'],
        password : {
          user : {
            domain : {
              id : 'default'
            },
            name : config.username,
            password : config.password
          }
        }
      },
      scope : {
        project : {
          domain : {
            id : 'default'
          },
          name : config.tenantName,
          id : config.tenantId
        }
      }
    }};
    var query = {
      ...url.parse(config.authURL + '/auth/tokens'),
      headers :  { 'Accept' : 'application/json' },
      json : true,
    };

    var res = await request(query, json);
    if(!(res.statusCode >= 200 && res.statusCode < 300))
      throw `Invalid swift credentials`;

    var payload = JSON.parse(await drain(res));

    let token = res.headers['x-subject-token'];
    var endpoints = dive(payload, 'token.catalog').reduce((full, catalog) => { //, k
      var publicUrl = dive(reindex(catalog.endpoints, 'region'), `${config.region}.url`);
      if(publicUrl)
        full[catalog.type]  = rtrim(publicUrl, '/');
      return full;
    }, {});


    var endpoint = (what, path) => {
      if(!endpoints[what])
        throw `Cannot lookup endpoint for service '${what}'`;
      return url.resolve(endpoints[what], path);
    };

    var headers  = {
      "X-Auth-Token" : token.id,
      "Accept" : "application/json"
    };

    query = (what, path, xtra) => {
      var target = {...url.parse(endpoint(what, path)), ...xtra};
      target.headers  = {...headers, ...target.headers};
      log.debug("Query", target);
      return target;
    };

    let containerCache = {};
    return {token, endpoints, endpoint, headers, query, containerCache};
  }

}

module.exports = Context;
