require("dotenv").config();

const path = require("path");
const url = require("url");

const express = require("express");
const helmet = require("helmet");

const { Provider } = require("oidc-provider");

const configuration = require("./src/configuration");
const routes = require("./src/routes");

const { PORT = 3000, ISSUER = `http://localhost:${PORT}` } = process.env;

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

app.set("views", path.join(__dirname, "src/views"));
app.set("view engine", "ejs");

let server;
(async () => {
  const prod = process.env.NODE_ENV === "production";

  const provider = new Provider(ISSUER, { ...configuration });

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

  routes(app, provider);
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
