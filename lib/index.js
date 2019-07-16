'use strict';
var util = require('util');

var request; // = require('@root/request');
var parseString = require('xml2js').parseString;
parseString = util.promisify(parseString);


const SANDBOX_URL = 'https://api.sandbox.namecheap.com/xml.response';
const PRODUCTION_URL = 'https://api.namecheap.com/xml.response';


var defaults = {
    baseUrl: PRODUCTION_URL
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

function assign(obj1,obj2) {
    for (var attrname in obj2) { obj1[attrname] = obj2[attrname]; }
}

function requestUrl(baseUrl, params) {
    var queryString = Object.keys(params).map(function (key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
    // console.debug(queryString);
    return baseUrl + '?' + queryString;
}

module.exports.create = function (config) {
    // config = { baseUrl, token }
    var baseUrl = config.baseUrl || defaults.baseUrl;

    var globalParams = {
        apiUser: config.apiUser,
        apiKey: config.apiKey,
        username: config.username,
        ClientIp: config.clientIp
    };

    function api(command, params) {
        var requestParams = extend(globalParams);
        requestParams['Command'] = command;
        assign(requestParams,params);

        var url = requestUrl(baseUrl, requestParams);
        // console.log(url);
        return request({
            method: 'POST',
            url: url,
        }).then(function (response) {
            var responseBody = response.body;
            console.log(responseBody);
            return parseString(responseBody).then(function (result) {
                // check response status
                if (result['ApiResponse']['$']['Status'] === 'ERROR') {
                    for (let i = 0; i < result['ApiResponse']['Errors'].length; i++) {
                        console.log(result['ApiResponse']['Errors'][i])
                    }
                    throw new Error('API Error');
                } else { // Status="OK"
                    return result['ApiResponse']['CommandResponse'][0]
                }
            });
        });
    }

    return {
        init: function (deps) {
          request = deps.request;
          return null;
        },

        zones: function(data) {
            return api('namecheap.domains.getList',{}).then(function (zonesResponse) {
                // console.log('zones');
                // console.log(zonesResponse);

                return zonesResponse['DomainGetListResult'].map(function (x) {
                    return x['Domain'][0]['$']['Name'];
                });

            });
        },

        set: function (data) {
            var ch = data.challenge;
            var txt = ch.dnsAuthorization;

            var params = {};
            var zone = ch.dnsZone;
            // the domain is the first part
            params['SLD'] = zone.split('.')[0];
            // the rest of the components are the TLD
            params['TLD'] = zone.split('.').splice(1).join('.');

            params['HostName1'] = ch.dnsPrefix;
            params['RecordType1'] = 'TXT';
            params['Address1'] = txt;
            params['TTL1'] = 1; // in minutes

            return api('namecheap.domains.dns.setHosts',params).then(function (setHostResponse) {
                // console.log('setHost');
                // console.log(setHostResponse);
                return true

            }).catch(function (err) {
                throw new Error('record did not set. check subdomain, api key, etc');
            });

        },
        remove: function (data) {
            var domainname = data.challenge.altname;
            var zone = domainname;

            throw new Error('not supported');

        },
        get: function (data) {
            var ch = data.challenge;

            var params = {};
            var zone = ch.dnsZone;

            // the domain is the first part
            params['SLD'] = zone.split('.')[0];
            // the rest of the components are the TLD
            params['TLD'] = zone.split('.').splice(1).join('.');

            return api('namecheap.domains.dns.getHosts',params).then(function (hostsResponse) {
                console.log('hosts');
                console.log(hostsResponse);

                var entries = hostsResponse['DomainDNSGetHostsResult'].filter(function (x) {

                    return x['$']['Type'] === 'TXT';
                });

                var entry = entries.filter(function (x) {
                    // console.log('data', x.data);
                    // console.log('dnsAuth', ch.dnsAuthorization, ch);
                    return x['$']['Address'] === ch.dnsAuthorization;
                })[0];

                if (entry) {
                    return {dnsAuthorization: entry['$']['Address']};
                } else {
                    return null;
                }

            });

        }
    };
};
