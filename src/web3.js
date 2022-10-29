const Web3 = require("web3");

const network = process.env.POLYGON_NETWORK;
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`
  )
);
web3.eth.defaultAccount = process.env.NFT_OIDC_APP_ADDRESS;

// [isUserLoggedIn] ... 署名したアドレスがユーザーのアドレスと同じか確認する
//     web3.eth.accounts.recover について
//         => https://web3js.readthedocs.io/en/v1.8.0/web3-eth-accounts.html?#recover
//     フロントエンドで使う? => https://web3js.readthedocs.io/en/v1.8.0/web3-eth-accounts.html#sign
const isUserLoggedIn = (
  originalMessage, // 元のメッセージ
  signature, // 署名済メッセージ
  ethereamAddress // ユーザーのウォレットアドレス
) => {
  const signerAddress = web3.eth.accounts.recover(originalMessage, signature);

  return signerAddress === ethereamAddress;
};

// [isCollectNFTOwner] ... ユーザーがNFTトークンの正しい所有者か確認する
//     web3.eth.Contract について
//         => https://web3js.readthedocs.io/en/v1.8.0/web3-eth-contract.html
//     IERC721 ownerOf について
//         => https://docs.openzeppelin.com/contracts/2.x/api/token/erc721#IERC721-ownerOf-uint256-
const isCollectNFTOwner = async (
  ethereamAddress, // ユーザーのウォレットアドレス
  tokenContractAddress, // NFTトークンコントラクトアドレス
  tokenID // NFTトークンID
) => {
  const jsonInterface = [
    {
      type: "function",
      name: "ownerOf",
      stateMutability: "nonpayable",
      inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
      outputs: [{ internalType: "address", name: "owner", type: "address" }],
    },
  ];

  try {
    const contract = new web3.eth.Contract(jsonInterface, tokenContractAddress);
    const ownerAddress = await contract.methods.ownerOf(tokenID).call();

    if (ethereamAddress === ownerAddress) {
      return true;
    } else {
      console.log("wrong owner");
    }
    return ethereamAddress === ownerAddress;
  } catch (e) {
    console.log(e);
  }
  return false;
};

module.exports = {
  isUserLoggedIn,
  isCollectNFTOwner,
}
