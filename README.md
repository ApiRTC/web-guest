# Apizee Web assisted

## Prerequisites

-   IDE / Code editor ([VS Code](https://code.visualstudio.com/Download) recommended to use TypeScript)
-   [GIT](https://git-scm.com/downloads) - Free and open source distributed version control system
-   [NodeJS](https://nodejs.org/en/) - JavaScript runtime built on Chrome's V8 JavaScript engine
-   [NPM](https://www.npmjs.com/) or [YARN](https://yarnpkg.com/lang/en/)

**At Apizee, we mainly use Yarn for its speed and the consistency offered by its yarn.lock file across installations.**

## Installation

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

```bash
$ git clone git@gitlab.apizee.com:code/web-assisted.git
```

With YARN :

```bash
$ yarn install
```

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

Merge your code in the the develop branch

**/!\ TEMPORARY PROCESS /!\\**

If you never make this procedure, you will need to add the Github repo of this app:

```bash
git remote add github git@github.com:ApiRTC/web-assisted.git
```

Note: the Github repo is **only use for the deployment** ! Do not push code directly on this repo.

```bash
git checkout main
git merge develop
git push github main
yarn predeploy
yarn deploy
```

## Release for validation

No validation process for now
