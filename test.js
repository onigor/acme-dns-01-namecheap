#!/usr/bin/env node
'use strict';

// https://git.rootprojects.org/root/acme-dns-01-test.js
var tester = require('acme-challenge-test');

// Usage: node ./test.js example.com xxxxxxxxx
var zone = process.argv[2];

var challenger = require('./index.js').create({
    apiUser:process.argv[3],
	apiKey : process.argv[4],
    clientIp:process.argv[5],
    username: process.argv[6]||process.argv[3]
});


// The dry-run tests can pass on, literally, 'example.com'
// but the integration tests require that you have control over the domain
tester
	.testZone('dns-01', zone, challenger)
    .then(function() {
        console.info('PASS', zone);
    })
    .catch(function(e) {
        console.info('FAIL', zone);
        console.error(e.message);
        console.error(e.stack);
    });

