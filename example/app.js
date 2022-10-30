const path = require("path");
const jose = require("jose");
const express = require("express");
const { auth, requiresAuth } = require("express-openid-connect");
const app = express();
const port = process.env.PORT || 3001;

const staticFile = (filename) => {
  return path.resolve(__dirname, "static", filename);
};

const accounts = [
  {
    "nft_contract_address": "0xF97Bd91B2399d4b45232717f1288C0f1dC9eEe09",
    "nft_item_id": "2"
  },
  {
    "nft_contract_address": "0xF97Bd91B2399d4b45232717f1288C0f1dC9eEe09",
    "nft_item_id": "5"
  }
]

app.use(
  auth({
    issuerBaseURL: "http://localhost:3000",
    baseURL: "https://example.localhost",
    clientID: "example_client",
    secret: "mmake95#kDuRRRR#3rak3r1dccaMd",
    authRequired: false,
    authorizationParams: {
      response_type: "id_token",
      response_mode: "form_post",
      scope: "openid",
    },
    afterCallback: (req, res, session) => {
      const claims = jose.decodeJwt(session.id_token);
      // example
      // {
      //   sub: '0xF97Bd91B2399d4b45232717f1288C0f1dC9eEe09/2',
      //   nft_contract_address: '0xF97Bd91B2399d4b45232717f1288C0f1dC9eEe09',
      //   nft_item_id: '2',
      //   nonce: 'zMBFYuM5WRy86IOIFcGYl7PM8tPHBPSl0WmPtG7F4Ac',
      //   s_hash: 'WxpefKbbgUvRDs_oYHGBQw',
      //   aud: 'example_client',
      //   exp: 1667108741,
      //   iat: 1667105141,
      //   iss: 'http://localhost:3000'
      // }
      console.log(claims)

      const {
        nft_contract_address,
        nft_item_id,
      } = claims
      const validAccount = accounts.find((account) => account.nft_contract_address === nft_contract_address && account.nft_item_id === nft_item_id)

      if (!validAccount) {
        res.send("Not Allowed NFT")
        return
      }

      return session;
    },
  })
);

app.get("/", (req, res) => {
  res.sendFile(staticFile("index.html"));
});

app.get("/private", requiresAuth(), (req, res) => {
  res.sendFile(staticFile("private.html"));
});

app.get("/images/:image", requiresAuth(), (req, res) => {
  res.sendFile(staticFile(`images/${req.params.image}`));
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
