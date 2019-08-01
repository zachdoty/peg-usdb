const Web3 = require("web3");
const HDWalletProvider = require("truffle-hdwallet-provider");

const networks = require("./networks.json");
const utils = require("./utils");

let gasPrice = process.argv[2] * 1e9;
let deployedContracts = {};

if (!process.argv[2]) {
    gasPrice = 22;
} else if (gasPrice < 1e8) {
    console.log("WARNING: GAS PRICE DANGEROUSLY LOW. TRANSACTIONS MAY NEVER GO THROUGH");
} else if (gasPrice > 1e11) {
    console.log("WARNING: GAS PRICE DANGEROUSLY HIGH. TRANSACTIONS WILL BE EXPENSIVE");
}
console.log("Gas price: " + gasPrice + " Gwei");

console.log("Deploying to main net...");
console.log("WARNING: THIS WILL USE REAL ETHER");
console.log("Press CTRL + C to cancel...");
const provider = new HDWalletProvider(networks.mainnet.mnemonic, "https://mainnet.infura.io/v3/" + networks.mainnet.infuraKey);

const web3 = new Web3(provider);

// change these addresses
const addressConverter = "0xb6556E3af9830212175121CbCA631Ded20F11ab4";
const addressContractIds = "0xb01DE83e220a5698B8770F085422f3f17e32B52d";
const addressRegistry = "0xb01DE83e220a5698B8770F085422f3f17e32B52d";

const RegistryABI = require("../abi/ContractRegistry.json").abi;
const ContractIdsABI = require("../abi/ContractIds.json").abi;

deployedContracts["RegistryContract"] = new web3.eth.Contract(RegistryABI, addressRegistry);
deployedContracts["ContractIdsContract"] = new web3.eth.Contract(ContractIdsABI, addressContractIds);

const transactions = [
    {
        deployed: "RegistryContract",
        function: "registerAddress",
        arguments: [
            async () => {
                return deployedContracts["ContractIdsContract"] ? await deployedContracts["ContractIdsContract"].methods.FEE_RECIPIENT().call() : null;
            },
            addressConverter
        ],
        value: 0
    }
];

const deployTransactions = async () => {
    for (let i = 0; i < transactions.length; i++) {
        let transactionInfo = transactions[i];
        let args = [];
        for (let arg of transactionInfo.arguments) {
            if (typeof arg !== "function") {
                args.push(arg);
            } else {
                args.push(await arg());
            }
        }
        await utils.deployTransaction(gasPrice, deployedContracts[transactionInfo.deployed], { ...transactionInfo, arguments: args }, web3);
    }
};

web3.eth.getAccounts().then(async accounts => {
    web3.eth.defaultAccount = accounts[0];
    await deployTransactions();
    console.log("Deploy completed...");
});
