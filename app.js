require("dotenv").config();

const path = require("path");
const url = require("url");

const express = require("express");
const helmet = require("helmet");

const { Provider } = require("oidc-provider");

const configuration = require("./src/configuration");
const routes = require("./src/routes");
const Adapter = require("./src/adapters/mongodb");

const prod = process.env.NODE_ENV === "production";

const PORT = 3000;
const ISSUER = prod ? "https://nft-login.clsl.net" : `http://localhost:${PORT}`;

const app = express();

app.use(express.static("public"));

const directives = helmet.contentSecurityPolicy.getDefaultDirectives();
delete directives["form-action"];
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives,
    },
  })
);

app.use(express.json());

app.set("views", path.join(__dirname, "src/views"));
app.set("view engine", "ejs");

let server;
(async () => {
  if (process.env.MONGODB_URI) {
    await Adapter.connect();
  }

  const provider = new Provider(ISSUER, { adapter: Adapter, ...configuration });

  if (prod) {
    app.enable("trust proxy");
    provider.proxy = true;

    app.use((req, res, next) => {
      if (req.secure) {
        next();
      } else if (req.method === "GET" || req.method === "HEAD") {
        res.redirect(
          url.format({
            protocol: "https",
            host: req.get("host"),
            pathname: req.originalUrl,
          })
        );
      } else {
        res.status(400).json({
          error: "invalid_request",
          error_description: "do yourself a favor and only use https",
        });
      }
    });
  }

  routes(app, provider, new Adapter("Client"));
  app.use(provider.callback());
  server = app.listen(PORT, () => {
    console.log(
      `application is listening on port ${PORT}, check its /.well-known/openid-configuration`
    );
  });
})().catch((err) => {
  if (server && server.listening) server.close();
  console.error(err);
  process.exitCode = 1;
});
