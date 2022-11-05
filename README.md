# nft-login

[東京 web3 ハッカソン](https://tokyo.akindo.io/)提出用リポジトリ。

## Overview

NFT でログインできる OpenID Connect identity provider (OIDC IdP) です。ある NFT の所有者に対してのみコンテンツを公開したいといった用途で使用できます。NFT は譲渡・売買が可能なため、NFT を譲渡可能な会員権のように使えるようになります。

This is an OpenID Connect identity provider (OIDC IdP). It allows owners of specific NFTs to access private contents. Since NFTs are transferable, you can use NFTs as transferable membership.

<!-- - Tech stacks
  - Node.js
  - [web3.js](https://github.com/web3/web3.js#readme)
- Blockchain
  - [Polygon Mumbai](https://wiki.polygon.technology/docs/develop/network-details/network/#mumbai-pos-testnet)
- Deployed Contract
  - N/A. We don't deploy Contract. -->

## Demo

TBD

## Usage

Register your app to [NFTLogin](https://nft-login.clsl.net) (our IdP as a service) and get `client_id` and `client_secret`. You needs them to request idToken from NFTLogin.

### Quick Start with Example App

```sh
$ git clone https://github.com/clarity-solutions/nft-login.git
```

Edit `example/accounts.js` file for allowing whitch NFT can access to your app.

When you run example in localhost, you need a reverse proxy to serve https locally.

- Caddy https://caddyserver.com/docs/install

```sh
$ caddy reverse-proxy --from example.localhost:443 --to localhost:3001
```

```sh
$ cd nft-login
$ npm i
$ npm run example
```

You can see an example app in https://example.localhost

## Development

Clone this repository and prepare the project.

```sh
$ npm install
$ node scripts/generate-keys.js
```

Create `.env` from `.env.example`.

Launch the server.

```sh
$ npm run dev
```
