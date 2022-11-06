const Web3 = require("web3");
const fetch = require("node-fetch");

class Web3Linker {
  constructor(networkName) {
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(
        `https://${networkName}.infura.io/v3/${process.env.INFURA_API_KEY}`
      )
    );
  }
  // [isUserLoggedIn] ... 署名したアドレスがユーザーのアドレスと同じか確認する
  //     web3.eth.accounts.recover について
  //         => https://web3js.readthedocs.io/en/v1.8.0/web3-eth-accounts.html?#recover
  async isUserLoggedIn(
    originalMessage, // 元のメッセージ
    signature, // 署名済メッセージ
    ethereamAddress // ユーザーのウォレットアドレス
  ) {
    const signerAddress = this.web3.eth.accounts.recover(
      originalMessage,
      signature
    );

    return signerAddress.toLowerCase() === ethereamAddress.toLowerCase();
  }

  // [isCollectNFTOwner] ... ユーザーがNFTトークンの正しい所有者か確認する
  //     web3.eth.Contract について
  //         => https://web3js.readthedocs.io/en/v1.8.0/web3-eth-contract.html
  //     IERC721 ownerOf について
  //         => https://docs.openzeppelin.com/contracts/2.x/api/token/erc721#IERC721-ownerOf-uint256-
  async isCollectNFTOwner(
    ethereamAddress, // ユーザーのウォレットアドレス
    tokenContractAddress, // NFTトークンコントラクトアドレス
    tokenID // NFTトークンID
  ) {
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
      const contract = new this.web3.eth.Contract(
        jsonInterface,
        tokenContractAddress
      );
      const ownerAddress = await contract.methods.ownerOf(tokenID).call();

      if (ethereamAddress.toLowerCase() === ownerAddress.toLowerCase()) {
        return true;
      } else {
        console.log("wrong owner", {
          ethereamAddress,
          ownerAddress,
        });
        return false;
      }
    } catch (e) {
      console.log(e);
    }
    return false;
  }

  async getNFTMetadata(tokenContractAddress, tokenID) {
    const jsonInterface = [
      {
        type: "function",
        name: "tokenURI",
        stateMutability: "nonpayable",
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        outputs: [
          { internalType: "string memory", name: "uri", type: "string" },
        ],
      },
    ];

    try {
      const contract = new this.web3.eth.Contract(
        jsonInterface,
        tokenContractAddress
      );
      const tokenURI = await contract.methods.tokenURI(tokenID).call();

      const res = await fetch(ipfsURIToGatewayURI(tokenURI));
      const buff = await res.arrayBuffer().then(Buffer.from);
      const metadata = JSON.parse(buff.toString());

      return metadata;
    } catch (e) {
      throw new Error(e);
    }
  }
}
const ipfsURIToGatewayURI = (ipfsURI) => {
  if (ipfsURI.startsWith("http")) {
    return ipfsURI;
  }
  const uri = "https://ipfs.io/ipfs/" + ipfsURI.replace("ipfs://", "");
  return uri;
};

module.exports = {
  Web3Linker,
};
