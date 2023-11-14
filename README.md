# ApiRTC Web Guest application

## Cloning a Project with Submodules

After normal clone, You must run two commands:

`git submodule init`

to initialize your local configuration file, and:

`git submodule update`

to fetch all the data from that project and check out the appropriate commit listed in the project.

Or you might clone with `--recurse-submodules` option.

## Installation

`yarn`

## Prerequisites

-   IDE / Code editor ([VS Code](https://code.visualstudio.com/Download) recommended to use TypeScript)
-   [GIT](https://git-scm.com/downloads) - Free and open source distributed version control system
-   [NodeJS](https://nodejs.org/en/) - JavaScript runtime built on Chrome's V8 JavaScript engine
-   [NPM](https://www.npmjs.com/) or [YARN](https://yarnpkg.com/lang/en/)

## Dependencies

This dependencies from GIT repositories are loaded as node modules from package.json

apiRTC : [Go to repository](https://apizee.codebasehq.com/projects/apizee-libs/repositories/lib-apirtc2/tree/master)  
MUI React Lib : [Go to repository](https://github.com/ApiRTC/mui-react-lib/tree/main)  
React Lib : [Go to repository](https://github.com/ApiRTC/react-lib/tree/main)

## Start local development server

If you run this repo for the first time, you will need to generate new certificates. To do this, see the regeneration command in the [Certificates](#certificates) section.

To start the local dev server, run:

```bash
$ yarn start
```

Vite will start a dev server an web app will be accessible a [https://localhost:3400](https://localhost:3400) by default.

### Certificates

If you have problem with the certificates:

-   on vite config file :
-   in the development configuration section
-   replace `https: true` with:

```ts
https: {
    key: fs.readFileSync(path.resolve(__dirname, '.cert/localhost.key')),
    cert: fs.readFileSync(path.resolve(__dirname, './.cert/localhost.crt')),
    ca: fs.readFileSync(path.resolve(__dirname, './.cert/RootCA.pem')),
},
```

On chrome program, you must add the certificate on the application preferences.  
you must choose `RootCA.crt` on `.cert` directory on the root of directory.  
save et relaunch program chrome

If you need to generate new certificates, please run:

```bash
yarn dev:regenerateCertificates
```

## Release for production

`yarn deploy`
