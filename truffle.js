let HDWalletProvider = require("truffle-hdwallet-provider");
let mnemonic = "monitor sheriff gasp language whale flavor pig unaware segment hidden useful twin";
let providerURL = "https://ropsten.infura.io/DU3KWryTCuhOAuEjVXZ5";
let provider = new HDWalletProvider(mnemonic, providerURL);

module.exports = {
    networks: {
        development: {
            host: "127.0.0.1",
            port: 8545,
            gas: 6721975,
            network_id: "*" // Match any network id
        },
        ropsten: {
            network_id: 3,
            provider: provider,
            from: provider.address,
            gas: 8003915,
            gasPrice: 30000000000
        },
        live: {
            gas: 7900000,
            provider: provider,
            from: provider.address,
            gasPrice: 2000000000,
            network_id: 1 // Ethereum public network
        }
    }
}; 
