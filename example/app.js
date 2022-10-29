const path = require("path");
const jose = require("jose");
const express = require("express");
const { auth, requiresAuth } = require("express-openid-connect");
const app = express();
const port = process.env.PORT || 3001;

const staticFile = (filename) => {
  return path.resolve(__dirname, "static", filename);
};

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
      // sub is accountId
      // {
      //   sub: '0xF97Bd91B2399d4b45232717f1288C0f1dC9eEe09/2',
      //   nonce: '-IygZH4FeWgPFoQp5i2yuHT98HR58Acfz_XlIhO4xAk',
      //   s_hash: 'WxpefKbbgUvRDs_oYHGBQw',
      //   aud: 'example_client',
      //   exp: 1667043182,
      //   iat: 1667039582,
      //   iss: 'http://localhost:3000'
      // }
      console.log(claims);
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

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
