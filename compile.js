var fs = require('fs');
var solc = require('solc');

var input = {};

function walk(dir) {
    for (file of fs.readdirSync(dir)) {
        if (fs.statSync(dir + '/' + file).isFile()) {
            const ext = file.split(".")[1];
            if(ext === "sol")
                input[dir + '/' + file] = fs.readFileSync(dir + '/' + file, 'utf8');
        } else {
            walk(dir + '/' + file);
        }
    }
}
walk('./contracts');

var output = solc.compile({ sources: input }, 1);

var fatal = false;
for (let error in output.errors) {
    let message = output.errors[error];
    let message2 = message.slice(message.indexOf(' ') + 1);
    if (message2.slice(0, message2.indexOf(' ')) == 'Warning:') {
        console.log(message);
    } else {
        fatal = true;
        console.error(message);
    }
}

if (fatal) {
    console.error('Fatal error on compile. Aborting...');
    return;
} else {
    if (!fs.existsSync('./solcbuild')) {
        fs.mkdirSync('./solcbuild');
    }
    // if (!fs.existsSync('../dapp/imports/startup/client/contracts')) {
    //     fs.mkdirSync('../dapp/imports/startup/client/contracts');
    // }
    if (!fs.existsSync('./abi')) {
        fs.mkdirSync('./abi');
    }
    for (let contractName in output.contracts) {
        let contractFileName = contractName.slice(contractName.lastIndexOf(':') + 1);
        fs.writeFileSync('./solcbuild/' + contractFileName + '.bin', output.contracts[contractName].bytecode);
        fs.writeFileSync('./solcbuild/' + contractFileName + '.abi', output.contracts[contractName].interface);
        // fs.writeFileSync('../dapp/imports/startup/client/contracts/' + contractFileName + '.json', `{"contractName": "${contractFileName}", "abi": ${output.contracts[contractName].interface}}`);        
        fs.writeFileSync('./abi/' + contractFileName + '.json', `{"contractName": "${contractFileName}", "abi": ${output.contracts[contractName].interface}}`);        
    }
}
