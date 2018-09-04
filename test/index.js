"use strict";

const expect = require('expect.js');
const path = require('path');
const container = "trashme_tests_ci";
const md5       = require('nyks/crypto/md5');

const drain = require('nyks/stream/drain');
const bl    = require('bl');

const OVHContext = require('../context');
const OVHStorage = require('../services/object-store');

describe("initial test suite", function() {
  this.timeout(10 * 1000);

  var ctx;
  before("should check for proper credentials", async () => {
    var creds;
    if(process.env['OS_USERNAME'])
      creds = {
        "username": process.env['OS_USERNAME'],
        "password": process.env['OS_PASSWORD'],
        "tenantId": process.env['OS_TENANT_ID'],
        "region"  : process.env['OS_REGION_NAME']
      };
    else
      creds = require('./credentials.json');

    ctx = await OVHContext.build(creds);
    console.log("Context is ready");
  });

  it("should create a dedicated container", async () => {
    var res = await OVHStorage.createContainer(ctx, container);
    expect(res).to.be.ok();
  });


  it("Should upload a dummy file", async () => {
    var body = "ping";
    var hash = md5(body);
    var tmp = bl(body);
    var headers = {etag : hash};

    var res = await OVHStorage.putStream(ctx, tmp, path.join(container, "/ping"), headers);
    expect(res.etag).to.eql(hash);
  });

  it("Should delete a dummy file", async () => {
    var res = await OVHStorage.deleteFile(ctx, path.join(container, "/ping"));
    expect(res).to.be.ok();
  });


  it("Should crash on corrupted file", async () => {
    var body = "ping";
    var hash = md5(body);
    var tmp = bl(body);
    try {
      var res = await OVHStorage.putStream(ctx, tmp, path.join(container, "/ping"), 'nope');
      expect().to.fail("Never here");
    } catch(err) {
      expect(err.res.statusCode).to.be(422); //Unprocessable Entity
    }
  });



});
