const fs = require("fs");
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

// const provider = new HDWalletProvider(networks.mainnet.mnemonic, "https://mainnet.infura.io/v3/" + networks.mainnet.infuraKey);
const provider = new HDWalletProvider(networks.mainnet.mnemonic, "https://rinkeby.infura.io/v3/" + networks.mainnet.infuraKey);

const web3 = new Web3(provider);

const contracts = [
    {
        contract: "SmartToken",
        arguments: ["PEG Network Token", "PEG:USD", 18],
        value: 0,
        deployed: "PEGUSDContract"
    },
    {
        contract: "ContractRegistry",
        arguments: [],
        value: 0,
        deployed: "InstanceRegistryContract"
    },
    {
        contract: "StableToken",
        arguments: [
            "Bancor USD Token",
            "BUSD",
            18,
            () => {
                return deployedContracts["InstanceRegistryContract"] ? deployedContracts["InstanceRegistryContract"].options.address : null;
            }
        ],
        value: 0,
        deployed: "StableTokenContract"
    },
    {
        contract: "StableToken",
        arguments: [
            "BUSD-PEGUSD Relay Token",
            "BUSD:PEGUSD",
            18,
            () => {
                return deployedContracts["InstanceRegistryContract"] ? deployedContracts["InstanceRegistryContract"].options.address : null;
            }
        ],
        value: 0,
        deployed: "RelayTokenContract"
    },
    {
        contract: "Vault",
        arguments: [
            () => {
                return deployedContracts["InstanceRegistryContract"] ? deployedContracts["InstanceRegistryContract"].options.address : null;
            }
        ],
        value: 0,
        deployed: "VaultAContract"
    },
    {
        contract: "Vault",
        arguments: [
            () => {
                return deployedContracts["InstanceRegistryContract"] ? deployedContracts["InstanceRegistryContract"].options.address : null;
            }
        ],
        value: 0,
        deployed: "VaultBContract"
    },
    {
        contract: "PegSettings",
        arguments: [
            () => {
                return [web3.eth.defaultAccount]
            },
            () => {
                return [
                    deployedContracts["PegLogicContract"] ? deployedContracts["PegLogicContract"].options.address : null,
                    deployedContracts["LogicActionsContract"] ? deployedContracts["LogicActionsContract"].options.address : null,
                    deployedContracts["AuctionActionsContract"] ? deployedContracts["AuctionActionsContract"].options.address : null,
                    deployedContracts["VaultAContract"] ? deployedContracts["VaultAContract"].options.address : null,
                    deployedContracts["VaultBContract"] ? deployedContracts["VaultBContract"].options.address : null
                ]
            },

        ],
        value: 0,
        deployed: "PegSettingsContract"
    },
    {
        contract: "PegLogic",
        arguments: [
            () => {
                return deployedContracts["InstanceRegistryContract"] ? deployedContracts["InstanceRegistryContract"].options.address : null;
            }
        ],
        value: 0,
        deployed: "PegLogicContract"
    },
    {
        contract: "LogicActions",
        arguments: [
            () => {
                return deployedContracts["InstanceRegistryContract"] ? deployedContracts["InstanceRegistryContract"].options.address : null;
            }
        ],
        value: 0,
        deployed: "LogicActionsContract"
    },
    {
        contract: "AuctionActions",
        arguments: [
            () => {
                return deployedContracts["InstanceRegistryContract"] ? deployedContracts["InstanceRegistryContract"].options.address : null;
            }
        ],
        value: 0,
        deployed: "AuctionActionsContract"
    },
    {
        contract: "Oracle",
        arguments: [],
        value: 0,
        deployed: "OracleContract"
    },
    {
        contract: "ContractIds",
        arguments: [],
        value: 0,
        deployed: "ContractIdsContract"
    }
];

const transactions = [
    {
        deployed: "InstanceRegistryContract",
        function: "registerAddress",
        arguments: [
            async () => {
                return deployedContracts["ContractIdsContract"] ? await deployedContracts["ContractIdsContract"].methods.COLLATERAL_TOKEN().call() : null;
            },
            () => {
                return '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c'
            }
        ],
        value: 0
    },
    {
        deployed: "InstanceRegistryContract",
        function: "registerAddress",
        arguments: [
            async () => {
                return deployedContracts["ContractIdsContract"] ? await deployedContracts["ContractIdsContract"].methods.PEGUSD_TOKEN().call() : null;
            },
            () => {
                return deployedContracts["PEGUSDContract"] ? deployedContracts["PEGUSDContract"].options.address : null;
            }
        ],
        value: 0
    },
    {
        deployed: "InstanceRegistryContract",
        function: "registerAddress",
        arguments: [
            async () => {
                return deployedContracts["ContractIdsContract"] ? await deployedContracts["ContractIdsContract"].methods.VAULT_A().call() : null;
            },
            () => {
                return deployedContracts["VaultAContract"] ? deployedContracts["VaultAContract"].options.address : null;
            }
        ],
        value: 0
    },
    {
        deployed: "InstanceRegistryContract",
        function: "registerAddress",
        arguments: [
            async () => {
                return deployedContracts["ContractIdsContract"] ? await deployedContracts["ContractIdsContract"].methods.VAULT_B().call() : null;
            },
            () => {
                return deployedContracts["VaultBContract"] ? deployedContracts["VaultBContract"].options.address : null;
            }
        ],
        value: 0
    },
    {
        deployed: "InstanceRegistryContract",
        function: "registerAddress",
        arguments: [
            async () => {
                return deployedContracts["ContractIdsContract"] ? await deployedContracts["ContractIdsContract"].methods.ORACLE().call() : null;
            },
            () => {
                return deployedContracts["OracleContract"] ? deployedContracts["OracleContract"].options.address : null;
            }
        ],
        value: 0
    },
    {
        deployed: "InstanceRegistryContract",
        function: "registerAddress",
        arguments: [
            async () => {
                return deployedContracts["ContractIdsContract"] ? await deployedContracts["ContractIdsContract"].methods.PEG_SETTINGS().call() : null;
            },
            () => {
                return deployedContracts["PegSettingsContract"] ? deployedContracts["PegSettingsContract"].options.address : null;
            }
        ],
        value: 0
    },
    {
        deployed: "InstanceRegistryContract",
        function: "registerAddress",
        arguments: [
            async () => {
                return deployedContracts["ContractIdsContract"] ? await deployedContracts["ContractIdsContract"].methods.STABLE_TOKEN().call() : null;
            },
            () => {
                return deployedContracts["StableTokenContract"] ? deployedContracts["StableTokenContract"].options.address : null;
            }
        ],
        value: 0
    },
    {
        deployed: "InstanceRegistryContract",
        function: "registerAddress",
        arguments: [
            async () => {
                return deployedContracts["ContractIdsContract"] ? await deployedContracts["ContractIdsContract"].methods.PEG_LOGIC().call() : null;
            },
            () => {
                return deployedContracts["PegLogicContract"] ? deployedContracts["PegLogicContract"].options.address : null;
            }
        ],
        value: 0
    },
    {
        deployed: "InstanceRegistryContract",
        function: "registerAddress",
        arguments: [
            async () => {
                return deployedContracts["ContractIdsContract"] ? await deployedContracts["ContractIdsContract"].methods.PEG_LOGIC_ACTIONS().call() : null;
            },
            () => {
                return deployedContracts["LogicActionsContract"] ? deployedContracts["LogicActionsContract"].options.address : null;
            }
        ],
        value: 0
    },
    {
        deployed: "InstanceRegistryContract",
        function: "registerAddress",
        arguments: [
            async () => {
                return deployedContracts["ContractIdsContract"] ? await deployedContracts["ContractIdsContract"].methods.AUCTION_ACTIONS().call() : null;
            },
            () => {
                return deployedContracts["AuctionActionsContract"] ? deployedContracts["AuctionActionsContract"].options.address : null;
            }
        ],
        value: 0
    },
    {
        deployed: "StableTokenContract",
        function: "issue",
        arguments: [
            () => {
                return web3.eth.defaultAccount;
            },
            web3.utils.toWei('10000', 'ether')
        ],
        value: 0
    },
    {
        deployed: "PEGUSDContract",
        function: "issue",
        arguments: [
            () => {
                return web3.eth.defaultAccount;
            },
            web3.utils.toWei('10000', 'ether')
        ],
        value: 0
    },
];

const rootDir = __dirname.replace("deploy", "");

const deployContracts = async () => {
    for (let i = 0; i < contracts.length; i++) {
        let contractInfo = contracts[i];
        const bytecode = await utils.readFile(`${rootDir}solcbuild/${contractInfo.contract}.bin`);
        const abi = await utils.readFile(`${rootDir}solcbuild/${contractInfo.contract}.abi`);
        let args = [];
        for (let arg of contractInfo.arguments) {
            if (typeof arg !== "function") {
                args.push(arg);
            } else {
                args.push(await arg());
            }
        }
        if (bytecode && abi) {
            let instance = await utils.deployContract(gasPrice, { ...contractInfo, arguments: args, bytecode: bytecode, abi: abi }, web3);
            deployedContracts[contractInfo.deployed] = instance;
        }
    }
};

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
    await deployContracts();
    await deployTransactions();

    let addresses = {};
    if (fs.existsSync(`${rootDir}mainnet-addresses.json`)) {
        addresses = require(`${rootDir}mainnet-addresses.json`);
    }
    addresses['mainnet'] = {
        pegusd_token: deployedContracts["PEGUSDContract"].options.address,
        stable_token: deployedContracts["StableTokenContract"].options.address,
        registry: deployedContracts["InstanceRegistryContract"].options.address,
        vaultA: deployedContracts["VaultAContract"].options.address,
        vaultB: deployedContracts["VaultBContract"].options.address,
        pegSettings: deployedContracts["PegSettingsContract"].options.address,
        pegLogic: deployedContracts["PegLogicContract"].options.address,
        logicActions: deployedContracts["LogicActionsContract"].options.address,
        auctionActions: deployedContracts["AuctionActionsContract"].options.address,
        oracle: deployedContracts["OracleContract"].options.address,
        ids: deployedContracts["ContractIdsContract"].options.address,
        relay: deployedContracts["RelayTokenContract"].options.address
    };

    fs.writeFileSync(`${rootDir}mainnet-addresses.json`, JSON.stringify(addresses));
    console.log("Deploy completed...");
});
