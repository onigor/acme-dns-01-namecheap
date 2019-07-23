# [acme-dns-01-namecheap](https://git.rootprojects.org/root/acme-dns-01-namecheap) | a [Root](https://rootrpojects.org) project

NameCheap DNS + Let's Encrypt

This handles ACME dns-01 challenges, compatible with ACME.js and Greenlock.js.
Passes [acme-dns-01-test](https://git.rootprojects.org/root/acme-dns-01-test.js).

# Install

```bash
npm install --save acme-dns-01-namecheap@3.x
```

# Usage

First you create an instance with your credentials:

```js
var dns01 = require('acme-dns-01-namecheap').create({
	apiUser: 'username',
	apiKey: 'xxxx',
	clientIp: 'public ip',
	username: 'username',
	baseUrl: 'https://api.namecheap.com/xml.response' // default
});
```

Then you can use it with any compatible ACME module,
such as Greenlock.js or ACME.js.

### Greenlock.js

```js
var Greenlock = require('greenlock-express');
var greenlock = Greenlock.create({
	challenges: {
		'dns-01': dns01
		// ...
	}
});
```

See [Greenlock™ Express](https://git.rootprojects.org/root/greenlock-express.js)
and/or [Greenlock.js](https://git.rootprojects.org/root/greenlock.js) documentation for more details.

### ACME.js

```js
// TODO
```

See the [ACME.js](https://git.rootprojects.org/root/acme-v2.js) for more details.

### Build your own

```js
dns01
	.set({
		identifier: { value: 'foo.example.com' },
		wildcard: false,
		dnsHost: '_acme-challenge.foo.example.com',
		dnsAuthorization: 'xxx_secret_xxx'
	})
	.then(function() {
		console.log('TXT record set');
	})
	.catch(function() {
		console.log('Failed to set TXT record');
	});
```

See [acme-dns-01-test](https://git.rootprojects.org/root/acme-dns-01-test.js)
for more implementation details.

# Tests

```bash
# node ./test.js domain-zone api-user api-key client-ip username [username is optional if similar to api-user]
node ./test.js example.com demo d41474b94e7d4536baabb074a09c96bd 45.77.4.126
```
