'use strict';
var util = require('util');

var request = require('@root/request');
request = util.promisify(request);
var parseString = require('xml2js').parseString;
parseString = util.promisify(parseString);


const SANDBOX_URL = 'https://api.sandbox.namecheap.com/xml.response';
const PRODUCTION_URL = 'https://api.namecheap.com/xml.response';


var defaults = {
    baseUrl: SANDBOX_URL
};

function extend(obj) {
    var newObj = {};
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            newObj[i] = obj[i];
        }
    }
    return newObj;
}

function requestUrl(baseUrl, params) {
    var queryString = Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
    console.debug(queryString);
    return baseUrl + '?' + queryString;
}

module.exports.create = function (config) {
    // config = { baseUrl, token }
    var baseUrl = config.baseUrl || defaults.baseUrl;

    var globalParams = {
        apiUser: config.apiUser,
        apiKey: config.apiKey,
        username: config.username,
        ClientIp: '122.178.155.204'
    };

    return {
        set: function (data) {
            var ch = data.challenge;
            var domainname = ch.identifier.value;
            var zone = domainname;

            var dnsPrefix = ch.dnsHost.replace(new RegExp('.' + zone + '$'), '');
            var txt = ch.dnsAuthorization;

            var params = extend(globalParams);
            params['Command'] = 'namecheap.domains.dns.setHosts';
            // the domain is the first part
            params['SLD'] = zone.split('.')[0];
            // the rest of the components are the TLD
            params['TLD'] = zone.split('.').splice(1).join('.');

            params['HostName1'] = dnsPrefix;
            params['RecordType1'] = 'TXT';
            params['Address1'] = txt;
            params['TTL1'] = 100;

            var url = requestUrl(baseUrl, params);
            console.debug(url);

            console.log('adding txt', data);
            return request({
                method: 'POST',
                url: url,
            }).then(function (resp) {
                resp = resp.body;
                console.log(resp);
                return parseString(resp, function (err, result) {
                    console.dir(result);
                    if (result['ApiResponse']['$']['Status'] === 'ERROR') {
                        for (let i = 0; i < result['ApiResponse']['Errors'].length; i++) {
                            console.log(result['ApiResponse']['Errors'][i])
                        }
                        throw new Error('record did not set. check subdomain, api key, etc');

                    } else {
                        return true
                    }
                });

            });
        },
        remove: function (data) {
            var domainname = data.challenge.altname;
            var zone = domainname;

            throw new Error('not supported');

        },
        get: function (data) {
            var ch = data.challenge;
            var domainname = data.challenge.altname;
            var zone = domainname;


            var params = extend(globalParams);
            params['Command'] = 'namecheap.domains.dns.getHosts';
            // the domain is the first part
            params['SLD'] = zone.split('.')[0];
            // the rest of the components are the TLD
            params['TLD'] = zone.split('.').splice(1).join('.');


            var url = requestUrl(baseUrl, params);
            console.debug(url);

            console.log('getting txt', data);
            return request({
                method: 'POST',
                url: url,
            }).then(function (resp) {
                resp = resp.body;

                return parseString(resp, function (err, result) {
                    console.dir(result);
                    if (result['ApiResponse']['$']['Status'] === 'ERROR') {
                        for (let i = 0; i < result['ApiResponse']['Errors'].length; i++) {
                            console.log(result['ApiResponse']['Errors'][i])
                        }
                        throw new Error('record did not set. check subdomain, api key, etc');

                    } else { // Status="OK"

                        var entries = result['ApiResponse']['CommandResponse']['DomainDNSGetHostsResult'].filter(function (x) {

                            return x['$']['Type'] === 'TXT';
                        });

                        var entry = entries.filter(function (x) {
                            console.log('data', x.data);
                            console.log('dnsAuth', ch.dnsAuthorization, ch);
                            return x['$']['Address'] === ch.dnsAuthorization;
                        })[0];

                        if (entry) {
                            return {dnsAuthorization: entry['$']['Address']};
                        } else {
                            return null;
                        }
                    }
                });
            });
        }
    };
};
