class InvalidSignatureError extends Error {
  constructor() {
    super("Invalid signature");
  }
}

class InvalidOwnerError extends Error {
  constructor() {
    super("The wallet address is not the NFT's owner");
  }
}

module.exports = {
  InvalidSignatureError,
  InvalidOwnerError,
};
