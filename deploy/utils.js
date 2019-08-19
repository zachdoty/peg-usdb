var fs = require('fs');

const doDeployContract = (gasPrice, web3, contractName, contract, args, bytecode, gas, value) => {
    return new Promise((resolve, reject) => {
        contract
            .deploy({
                arguments: args,
                data: bytecode
            })
            .send({
                from: web3.eth.defaultAccount,
                value: value,
                gas: gas + 10,
                gasPrice: gasPrice
            })
            .on('error', err => {
                console.error('Error on deploy ' + contractName + ': ' + err);
                reject(false);
            })
            .on('transactionHash', hash => {
                console.log('\tDeploying ' + contractName + ': ' + hash);
            })
            .then(instance => {
                console.log(contractName + ': ' + instance.options.address);
                resolve(instance);
            });
    });
}

const deployContract = async (gasPrice, contractInfo, web3) => {
    let bytecode = '0x' + contractInfo.bytecode;

    try {
        let contract = new web3.eth.Contract(JSON.parse(contractInfo.abi));
        let gas = await contract
            .deploy({
                arguments: contractInfo.arguments,
                data: bytecode
            }).estimateGas();
        return await doDeployContract(gasPrice, web3, contractInfo.deployed, contract, contractInfo.arguments, bytecode, gas.valueOf(), contractInfo.value);
    } catch (err) {
        console.error('Error on ' + contractInfo.contract + ': ' + err);
    }
};

const doDeployTransaction = (gasPrice, contractInstance, transactionInfo, args, gas, web3) => {
    return new Promise((resolve, reject) => {
        contractInstance.methods[transactionInfo.function](...args)
            .send({
                from: web3.eth.defaultAccount,
                value: transactionInfo.value,
                gas: gas + 10,
                gasPrice: gasPrice
            })
            .on('error', (err, receipt) => {
                console.error('Transaction error ' + transactionInfo.deployed + '.' + transactionInfo.function+': ' + err);
                reject(false);
            })
            .on('transactionHash', hash => {
                console.log(transactionInfo.deployed + '.' + transactionInfo.function+': ' + hash);
                resolve(true);
            })
    });
}

const deployTransaction = async (gasPrice, contractInstance, transactionInfo, web3) => {
    try {
        let gas = await contractInstance.methods[transactionInfo.function](...transactionInfo.arguments)
            .estimateGas();
        try {
            await doDeployTransaction(gasPrice, contractInstance, transactionInfo, transactionInfo.arguments, gas.valueOf(), web3);
        } catch (err) {}
    } catch (err) {
        console.error('Error on gas estimate ' + transactionInfo.deployed + ': ' + err);
    }
}

const readFile = async _file => {
    if (fs.statSync(_file).isFile()) {
        return await fs.readFileSync(_file, 'utf8');
    } else {
        return false;
    }
}

module.exports = {
    readFile: readFile,
    deployContract: deployContract,
    deployTransaction: deployTransaction
};