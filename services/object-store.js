'use strict';

const url    = require('url');

const get       = require('mout/object/get');
const deepMixIn = require('mout/object/deepMixIn');
const rtrim     = require('mout/string/rtrim');
const reindex   = require('nyks/collection/reindex');

  
const promisify = require('nyks/function/promisify');
const request   = promisify(require('nyks/http/request'));
const drain     = require('nyks/stream/drain');


class OVHStorage {

  constructor(config) {
    this.config = Object.assign({
      authURL:  'https://auth.cloud.ovh.net/v2.0',
      region:   'GRA3',
    }, config);
  }


  async getCtx() {
    var json = {
      auth: {
        passwordCredentials: {
          username: this.config.username,
          password: this.config.password
        },
        tenantId: this.config.tenantId
      }
    };

    var query = Object.assign(url.parse(this.config.authURL + '/tokens'), {
      headers:  { 'Accept': 'application/json' },
      json : true,
    });

    var res = await request(query, json);
    var payload = JSON.parse(await drain(res));


    var token           = get(payload, 'access.token');
    var endpoints = get(payload, 'access.serviceCatalog').reduce( (full, catalog, k) => {
      var publicUrl = get(reindex(catalog.endpoints, 'region'), `${this.config.region}.publicURL`);
      full[catalog.type]  = rtrim(publicUrl, '/') + '/'; //enforce trailing /
      return full;
    }, {});


    var endpoint = (what, path) => url.resolve(endpoints[what], path);
    var headers  = {
      "X-Auth-Token": token.id,
      "Accept": "application/json"
    };
    var query = (what, path, xtra) => deepMixIn(url.parse(endpoint(what, path)), {headers}, xtra);

    return {token, endpoints, endpoint, headers, query};
  }



  async createContainer(ctx, container) {
    var query = ctx.query('object-store', container, {
      method:   'PUT',
    });
    var res = await request(query, stream);
    await drain(res);
    return res.headers;
  }


  async download(ctx, path) {
    var query = ctx.query('object-store', path);
    var res = await request(query);
    return res;
  }

  async putFile(ctx, localfile, path, headers) {
    var stream = fs.createReadStream(localfile);
    return this.putStream(ctx, stream, path, headers);
  }

  async putStream(ctx, stream, path, headers) {
    var query = ctx.query('object-store', path, {
      method:   'PUT',
    });
    var res = await request(query, stream);
    await drain(res);
    return res.headers;
  }


  async deleteFile(ctx, path) {
    var query = ctx.query('object-store', path, {
      method:   'DELETE',
    });
    var res = await request(query);
    await drain(res);
    return res.headers;
  }

  async toggleMode(ctx, container, mode) {
    var query = ctx.query('object-store',  container, {
      method:   'POST',
      headers : {
        'X-Container-Read': mode
      }
    });

    var res = await request(query);
    await drain(res); //make sure to close
    return res.headers;
  }

  async getFileList(ctx, container) {
    var query = ctx.query('object-store',  container);
    var res  = await request(query);
    var body = JSON.parse(await drain(res));
    return body;
  }

  async showContainer(ctx, container) {
    var query = ctx.query('object-store',  container, {
      method:   'HEAD',
    });

    var res = await request(query);
    await drain(res); //make sure to close
    return res.headers;
  }

}

module.exports = OVHStorage;