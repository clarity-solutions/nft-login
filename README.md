# nft-oidc

[東京 web3 ハッカソン](https://tokyo.akindo.io/)提出用リポジトリ。

## Overview

NFT でログインできる OpenID Connect identity provider (OIDC IdP) です。ある NFT の所有者に対してのみコンテンツを公開したいといった用途で使用できます。NFT は譲渡・売買が可能なため、NFT を譲渡可能な会員権のように使えるようになります。

This is an OpenID Connect identity provider (OIDC IdP). It allows owners of specific NFTs to access private contents. Since NFTs are transferable, you can use NFTs as transferable membership.

- Tech stacks
  - Node.js
  - [web3.js](https://github.com/web3/web3.js#readme)
- Blockchain
  - [Polygon Mumbai](https://wiki.polygon.technology/docs/develop/network-details/network/#mumbai-pos-testnet)
- Deployed Contract
  - N/A. We don't deploy Contract.

## Demo

TBD

## Development

Clone this repository and prepare the project.

```
npm install
node scripts/generate-keys.js
```

Create `.env` from `.env.example`.

Launch the server.

```
npm run dev
```

### Example website

You need a reverse proxy to serve https locally.

- Caddy https://caddyserver.com/docs/install

```
$ caddy reverse-proxy --from example.localhost:443 --to localhost:3001
```

```
npm run example
```
