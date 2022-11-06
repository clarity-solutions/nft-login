const { strict: assert } = require("assert");
const crypto = require("crypto");
const querystring = require("querystring");
const { inspect } = require("util");

const isEmpty = require("lodash/isEmpty");
const { urlencoded } = require("express");

const { Web3Linker } = require("./web3");
const { InvalidSignatureError, InvalidOwnerError } = require("./errors");

const body = urlencoded({ extended: false });

const keys = new Set();
const debug = (obj) =>
  querystring.stringify(
    Object.entries(obj).reduce((acc, [key, value]) => {
      keys.add(key);
      if (isEmpty(value)) return acc;
      acc[key] = inspect(value, { depth: null });
      return acc;
    }, {}),
    "<br/>",
    ": ",
    {
      encodeURIComponent(value) {
        return keys.has(value) ? `<strong>${value}</strong>` : value;
      },
    }
  );

module.exports = (app, provider, clientAdapter) => {
  const {
    constructor: {
      errors: { SessionNotFound },
    },
  } = provider;

  function setNoCache(req, res, next) {
    res.set("cache-control", "no-store");
    next();
  }

  app.get("/interaction/:uid", setNoCache, async (req, res, next) => {
    try {
      const { uid, prompt, params, session } =
        await provider.interactionDetails(req, res);

      const client = await provider.Client.find(params.client_id);

      switch (prompt.name) {
        case "login": {
          return res.render("login", {
            client,
            uid,
            details: prompt.details,
            params,
            title: "Sign-in",
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt),
            },
          });
        }
        case "consent": {
          return res.render("interaction", {
            client,
            uid,
            details: prompt.details,
            params,
            title: "Authorize",
            session: session ? debug(session) : undefined,
            dbg: {
              params: debug(params),
              prompt: debug(prompt),
            },
          });
        }
        default:
          return undefined;
      }
    } catch (err) {
      return next(err);
    }
  });

  app.post("/interaction/:uid/login", setNoCache, body, async (req, res) => {
    try {
      console.log(1);
      const details = await provider.interactionDetails(req, res);
      console.log("interactionDetails on /interaction/:uid/login", details);

      const originalMessage = `Sign in with NFT: ${req.params.uid}`;

      const { signature, ethereamAddress, network, contractAddress, tokenID } =
        req.body;

      let web3linker = new Web3Linker("polygon-mumbai");
      const isValidSignature = web3linker.isUserLoggedIn(
        originalMessage,
        signature,
        ethereamAddress
      );
      if (!isValidSignature) {
        throw new InvalidSignatureError();
      }

      if (network == "goerli") {
        web3linker = new Web3Linker(process.env.GOERLI_RPC_URI);
      }

      const isValidOwner = await web3linker.isCollectNFTOwner(
        ethereamAddress,
        contractAddress,
        tokenID
      );
      if (!isValidOwner) {
        throw new InvalidOwnerError();
      }

      const result = {
        login: {
          accountId: `${network}/${contractAddress}/${tokenID}`,
        },
      };

      await provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
      });
      console.log("interactionFinished");
    } catch (err) {
      console.error(`Error on "/interaction/:uid/login"`, err.message);
      res.redirect(`/interaction/${req.params.uid}?error=${err.message}`);
    }
  });

  app.post(
    "/interaction/:uid/confirm",
    setNoCache,
    body,
    async (req, res, next) => {
      try {
        const interactionDetails = await provider.interactionDetails(req, res);
        console.log(
          "interactionDetails on /interaction/:uid/confirm",
          interactionDetails
        );
        const {
          prompt: { name, details },
          params,
          session: { accountId },
        } = interactionDetails;
        assert.equal(name, "consent");

        let { grantId } = interactionDetails;
        let grant;

        if (grantId) {
          // we'll be modifying existing grant in existing session
          grant = await provider.Grant.find(grantId);
        } else {
          // we're establishing a new grant
          grant = new provider.Grant({
            accountId,
            clientId: params.client_id,
          });
        }

        if (details.missingOIDCScope) {
          grant.addOIDCScope(details.missingOIDCScope.join(" "));
        }
        if (details.missingOIDCClaims) {
          grant.addOIDCClaims(details.missingOIDCClaims);
        }
        if (details.missingResourceScopes) {
          // eslint-disable-next-line no-restricted-syntax
          for (const [indicator, scopes] of Object.entries(
            details.missingResourceScopes
          )) {
            grant.addResourceScope(indicator, scopes.join(" "));
          }
        }

        grantId = await grant.save();

        const consent = {};
        if (!interactionDetails.grantId) {
          // we don't have to pass grantId to consent, we're just modifying existing one
          consent.grantId = grantId;
        }

        const result = { consent };
        await provider.interactionFinished(req, res, result, {
          mergeWithLastSubmission: true,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  app.get("/interaction/:uid/abort", setNoCache, async (req, res, next) => {
    try {
      const result = {
        error: "access_denied",
        error_description: "End-User aborted interaction",
      };
      await provider.interactionFinished(req, res, result, {
        mergeWithLastSubmission: false,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/clients", body, async (req, res, next) => {
    try {
      const { appName, redirectURI, postLogoutRedirectURI } = req.body;

      if (!appName) {
        res.redirect(`/register.html?error=App Name is required.`);
        return;
      }

      if (!redirectURI) {
        res.redirect(`/register.html?error=Redirect URI is required.`);
        return;
      }

      const client_id = crypto.randomUUID();
      const client_secret = crypto.randomBytes(256).toString("base64");
      const client = {
        client_name: appName,
        client_id,
        partitionKey: "",
        client_secret,
        redirect_uris: [redirectURI],
        post_logout_redirect_uris: [postLogoutRedirectURI].filter(Boolean),
        response_types: ["id_token"],
        grant_types: ["implicit"],
        token_endpoint_auth_method: "none",
      };

      await clientAdapter.upsert(client_id, client);
      const result = await clientAdapter.find(client_id);
      console.log(result);

      res.render("registered", {
        client,
      });
    } catch (err) {
      res.redirect(
        `/register.html?error=Sorry. Internal server error occured. Please retry again.`
      );
      next(err);
    }
  });

  app.use((err, req, res, next) => {
    if (err instanceof SessionNotFound) {
      // handle interaction expired / session not found error
    }
    next(err);
  });
};
