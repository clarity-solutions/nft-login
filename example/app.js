const path = require("path");
const fs = require("fs/promises");
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
