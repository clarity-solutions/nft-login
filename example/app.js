const path = require("path");
const jose = require("jose");
const express = require("express");
const { auth, requiresAuth } = require("express-openid-connect");
const app = express();
const port = process.env.PORT || 3001;

const staticFile = (filename) => {
  return path.resolve(__dirname, "static", filename);
};

const accounts = [2, 5, 6, 7, 8, 9, 10, 11].map((n) => {
  return {
    nft_contract_address: "0xF97Bd91B2399d4b45232717f1288C0f1dC9eEe09",
    nft_item_id: n,
  };
});

const prd = process.env.NODE_ENV === "production";

app.use(
  auth({
    issuerBaseURL: prd ? "https://nftoidc.clsl.net" : "http://localhost:3000",
    baseURL: prd
      ? "https://nftoidc-example.clsl.net"
      : "https://example.localhost",
    clientID: "263de25f-ba14-4ad4-849a-ae473e4f9641", // change to your clientID
    secret:
      "Qzbzd3ZICF7dwkeYZBYo6tMXgBgt3QqK6goZe17OYKbwjM8ZwVyMQ59ToreVDL2zm1q36w7QpuemNR0VFO4bx2HsNCH4ESxcrU362hs3S5rqhVqpbfBP3+aJ+o9HAS9tIWBdMwICP94jiQY4rN54gnW8m3XvNPErRcfZ1/4la7a8y3Bvr1O+xYpX9HhC8+Qj0pm+rLcJYZHy21Mw3U46+iJoeQN6QXLIBa1EBTn1Wr0ECqQRoCnWoCOPsLkq0CsNMNic/z3W1kHGEf2ZHw0blaY8IKedIrxeD7ijwwbymAPgOH2JI+oHRtEv65Pgvq1GxJgYPlis4Yh0WJZddAdPhQ==", // change to your clientSecret
    authRequired: false,
    authorizationParams: {
      response_type: "id_token",
      response_mode: "form_post",
      scope: "openid",
    },
    idpLogout: true,
    afterCallback: (req, res, session) => {
      const claims = jose.decodeJwt(session.id_token);
      // example
      // {
      //   sub: '0xF97Bd91B2399d4b45232717f1288C0f1dC9eEe09/2', # account_id
      //   nft_contract_address: '0xF97Bd91B2399d4b45232717f1288C0f1dC9eEe09',
      //   nft_item_id: '2',
      //   nonce: 'zMBFYuM5WRy86IOIFcGYl7PM8tPHBPSl0WmPtG7F4Ac',
      //   s_hash: 'WxpefKbbgUvRDs_oYHGBQw',
      //   aud: '8fbe64c4-c279-4f91-971d-1419a9553ddb', # client_id
      //   exp: 1667108741,
      //   iat: 1667105141,
      //   iss: 'http://localhost:3000'
      // }
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

app.get("/private", requiresAuth(), (req, res) => {
  res.sendFile(staticFile("private.html"));
});

app.get("/images/:image", requiresAuth(), (req, res) => {
  res.sendFile(staticFile(`images/${req.params.image}`));
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
