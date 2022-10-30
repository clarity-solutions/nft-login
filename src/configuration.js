require("dotenv").config();

// It must be generated by generate-keys.js script
const jwks = require("./jwks.json");

const clients = require("./clients.json");

module.exports = {
  clients: clients.map(({ client }) => client),
  interactions: {
    url(ctx, interaction) {
      return `/interaction/${interaction.uid}`;
    },
  },
  async findAccount(ctx, sub) {
    // sub is "/"-separated string
    const [nft_contract_address, nft_item_id] = sub.split("/");
    return {
      accountId: sub,
      async claims() {
        return {
          sub,
          nft_contract_address,
          nft_item_id,
        };
      },
    };
  },
  responseTypes: ["id_token"],
  cookies: {
    keys: process.env.OIDCP_SECURE_KEYS.split(","),
  },
  claims: {
    openid: ["sub", "nft_contract_address", "nft_item_id"],
  },
  features: {
    devInteractions: {
      enabled: false,
    },
  },
  jwks,
};
