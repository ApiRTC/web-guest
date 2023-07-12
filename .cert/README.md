# How to create an HTTPS certificate for localhost domains

This focuses on generating the certificates for loading local virtual hosts hosted on your computer, for development only.


**Do not use self-signed certificates in production !**
For online certificates, use Let's Encrypt instead ([tutorial](https://gist.github.com/cecilemuller/a26737699a7e70a7093d4dc115915de8)).



## Certificate authority (CA)

Generate `RootCA.pem`, `RootCA.key` & `RootCA.crt`:

	openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 -keyout RootCA.key -out RootCA.pem -subj "/C=US/CN=Example-Root-CA"
	openssl x509 -outform pem -in RootCA.pem -out RootCA.crt

Note that `Example-Root-CA` is an example, you can customize the name.


## Domain name certificate

Let's say you have two domains `fake1.local` and `fake2.local` that are hosted on your local machine
for development (using the `hosts` file to point them to `127.0.0.1`).

First, create a file `domains.ext` that lists all your local domains:

	authorityKeyIdentifier=keyid,issuer
	basicConstraints=CA:FALSE
	keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
	subjectAltName = @alt_names
	[alt_names]
	DNS.1 = localhost
	DNS.2 = fake1.local
	DNS.3 = fake2.local

Generate `localhost.key`, `localhost.csr`, and `localhost.crt`:

	openssl req -new -nodes -newkey rsa:2048 -keyout localhost.key -out localhost.csr -subj "/C=US/ST=YourState/L=YourCity/O=Example-Certificates/CN=localhost.local"
	openssl x509 -req -sha256 -days 1024 -in localhost.csr -CA RootCA.pem -CAkey RootCA.key -CAcreateserial -extfile domains.ext -out localhost.crt

Note that the country / state / city / name in the first command  can be customized.

# Webpack devServer

https://webpack.js.org/configuration/dev-server/#devserverhttps

	module.exports = {
	//...
	devServer: {
		https: {
		key: fs.readFileSync('/path/to/server.key'),
		cert: fs.readFileSync('/path/to/server.crt'),
		ca: fs.readFileSync('/path/to/ca.pem'),
		}
	}
	};
