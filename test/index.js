"use strict";

const expect = require('expect.js');
const OVHContext = require('../context');


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






});
