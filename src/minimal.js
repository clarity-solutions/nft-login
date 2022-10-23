const Provider = require('oidc-provider');

// new Provider instance with no extra configuration, will run in default, just needs the issuer
// identifier, uses data from runtime-dyno-metadata heroku here
const oidc = new Provider("http://localhost:3000", {
  clients: [
    {
      client_id: 'example_client',
      client_secret: 'mmake95#kDuRRRR#3rak3r1dccaMd',
      redirect_uris: [
        'https://example.localhost/callback',
        // using jwt.io as redirect_uri to show the ID Token contents
        'https://jwt.io',
      ],
      response_types: ['id_token'],
      grant_types: ['implicit'],
      token_endpoint_auth_method: 'none',
    },
  ],
  cookies: {
    keys: ["foo", "bar"],
  },
});

// Heroku has a proxy in front that terminates ssl, you should trust the proxy.
oidc.proxy = true;

// listen on the heroku generated port
oidc.listen(3000);
