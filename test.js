#!/usr/bin/env node
'use strict';

// https://git.coolaj86.com/coolaj86/acme-challenge-test.js
var tester = require('acme-challenge-test');

// Usage: node ./test.js example.com xxxxxxxxx
var zone = process.argv[2];

var challenger = require('./index.js').create({
    apiUser:process.argv[3],
	apiKey : process.argv[4],
    username: process.argv[5]||process.argv[3]
});


// The dry-run tests can pass on, literally, 'example.com'
// but the integration tests require that you have control over the domain
var domain = zone;

tester
	.test('dns-01', domain, challenger)
	.then(function() {
		console.info('PASS', domain);
    ///*
		domain = 'foo.' + zone;

		return tester
			.test('dns-01', domain, challenger)
			.then(function() {
				console.info('PASS', domain);
			})
			.then(function() {
				domain = '*.foo.' + zone;

				return tester.test('dns-01', domain, challenger).then(function() {
					console.info('PASS', domain);
				});
			});
      //*/
	})
	.catch(function(e) {
        console.info('ERROR', domain);

        console.error(e.message);
		console.error(e.stack);
	});

