const crypto = require("crypto");
const CosmosClient = require("@azure/cosmos").CosmosClient;

const endpoint = process.env.DATABASE_ENDPOINT;
const key = process.env.DATABASE_KEY;

const databaseId = "NFT-OIDC";
const containerId = "clients";

const options = {
  endpoint: endpoint,
  key: key,
  userAgentSuffix: "NFT-OIDC-",
};

const client = new CosmosClient(options);

/**
 * Register new client
 */
async function registerClientApp(
  name,
  redirectURIs,
  post_logout_redirect_uris = ""
) {
  const client_id = crypto.randomUUID();
  const client_secret = crypto.randomBytes(256).toString("base64");
  await createFamilyItem({
    client_name: name,
    client_id,
    id: client_id,
    partitionKey: "",
    client_secret,
    redirect_uris: redirectURIs,
    post_logout_redirect_uris,
    response_types: ["id_token"],
    grant_types: ["implicit"],
    token_endpoint_auth_method: "none",
  });

  return {
    id: client_id,
    client_secret,
  };
}

/**
 * Create family item if it does not exist
 */
async function createFamilyItem(itemBody) {
  const { item } = await client
    .database(databaseId)
    .container(containerId)
    .items.upsert(itemBody);
  console.log(`Created family item with id:\n${itemBody.id}\n`);
  console.log({ item });
  return item;
}

/**
 * Query the container using SQL
 */
async function queryContainer() {
  console.log(`Querying container:\n${containerId}`);

  const querySpec = {
    query: "SELECT * FROM root",
  };

  const { resources: clients } = await client
    .database(databaseId)
    .container(containerId)
    .items.query(querySpec)
    .fetchAll();

  return clients;
}

module.exports = { registerClientApp, queryContainer };
