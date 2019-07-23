#!/usr/bin/env node
'use strict';

// https://git.rootprojects.org/root/acme-dns-01-test.js
var tester = require('acme-challenge-test');
require('dotenv').config();

// Usage: node ./test.js example.com xxxxxxxxx
var zone = process.argv[2] || process.env.ZONE;

var challenger = require('./index.js').create({
	apiUser: process.argv[3] || process.env.API_USER,
	apiKey: process.argv[4] || process.env.API_KEY || process.env.TOKEN,
	clientIp: process.argv[5] || process.env.CLIENT_IP,
	username:
		process.argv[6] ||
		process.env.USERNAME ||
		process.argv[3] ||
		process.env.API_USER
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
