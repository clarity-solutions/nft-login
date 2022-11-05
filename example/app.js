require("dotenv").config()

const path = require("path");
const jose = require("jose");
const express = require("express");
const { auth, requiresAuth } = require("express-openid-connect");
const app = express();
const port = process.env.PORT || 3001;

const undefinedEnvs = [
  "OIDC_ISSUER_BASE_URL",
  "OIDC_BASE_URL",
  "OIDC_CLIENT_ID",
  "OIDC_CLIENT_SECRET",
].filter((envName) => !process.env[envName])
if (undefinedEnvs.length > 0) {
  console.error(`Environment variables ${undefinedEnvs.join(", ")} are required. You should set them at example/.env`)
  process.exit(1)
}

const {
  OIDC_ISSUER_BASE_URL,
  OIDC_BASE_URL,
  OIDC_CLIENT_ID,
  OIDC_CLIENT_SECRET,
} = process.env

const staticFile = (filename) => {
  return path.resolve(__dirname, "static", filename);
};

const accounts = [2, 5, 6, 7, 8, 9, 10, 11].map((n) => {
  return {
    nft_contract_address: "0xF97Bd91B2399d4b45232717f1288C0f1dC9eEe09",
    nft_item_id: n,
  };
});

app.set("views", path.join(__dirname, "ejs"));
app.set("view engine", "ejs");

app.use(
  auth({
    issuerBaseURL: OIDC_ISSUER_BASE_URL,
    baseURL: OIDC_BASE_URL,
    clientID: OIDC_CLIENT_ID,
    secret: OIDC_CLIENT_SECRET,
    authRequired: false,
    authorizationParams: {
      response_type: "id_token",
      response_mode: "form_post",
      scope: "openid",
    },
    idpLogout: true,
    afterCallback: (req, res, session) => {
      const claims = jose.decodeJwt(session.id_token);
      console.log({ claims });
      // example
      //   claims: {
      //     sub: '0xF97Bd91B2399d4b45232717f1288C0f1dC9eEe09/5',
      //     nft_contract_address: '0xF97Bd91B2399d4b45232717f1288C0f1dC9eEe09',
      //     nft_item_id: '5',
      //     nft_metadata: {
      //       name: 'first OYT',
      //       description: 'This is the first Token of Cubifox.',
      //       image: 'ipfs://bafybeifanyrc6wpqccxyy4wie44le7ocxgmoas2pv3mjzu5vjtjnok5xvy/mamabutter.png',
      //       objectURI: 'ipfs://bafybeicr26dsoru4gwwfxrpzxmm2wx6rlrytwjndspjnkmijzxcprkeksi/mamabutter.obj.zip'
      //     },
      //     nonce: 'IqUJxVB3yOrgirgo9fsdDQtQhYL5kD4g-6iUUkuEhn0',
      //     s_hash: 'WxpefKbbgUvRDs_oYHGBQw',
      //     aud: '4c6058d1-9055-46d6-91ff-bd32582ff885',
      //     exp: 1667459251,
      //     iat: 1667455651,
      //     iss: 'http://localhost:3000'
      //   }

      const { nft_contract_address, nft_item_id } = claims;
      const validAccount = accounts.find(
        (account) =>
          account.nft_contract_address.toLowerCase() ===
            nft_contract_address.toLowerCase() &&
          account.nft_item_id == nft_item_id
      );

      if (!validAccount) {
        res.send("Not Allowed NFT");
        return;
      }

      return session;
    },
  })
);

app.get("/", (req, res) => {
  res.sendFile(staticFile("index.html"));
});

const ipfsURIToGatewayURI = (ipfsURI) => {
  if (ipfsURI.startsWith("http")) {
    return ipfsURI;
  }
  const uri = "https://ipfs.io/ipfs/" + ipfsURI.replace("ipfs://", "");
  return uri;
};

app.get("/private", requiresAuth(), (req, res) => {
  const {
    nft_metadata: { name: nftName, image: nftImage },
  } = req.oidc.user;
  res.render("private", {
    nftName,
    nftImage: ipfsURIToGatewayURI(nftImage),
  });
});

app.get("/images/:image", requiresAuth(), (req, res) => {
  res.sendFile(staticFile(`images/${req.params.image}`));
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
