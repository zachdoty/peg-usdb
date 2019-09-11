// const PEGUSDContract = artifacts.require('PegNetworkToken');
// const CollateralTokenContract = artifacts.require('BancorNetworkToken');
// const InstanceRegistryContract = artifacts.require('ContractRegistry');
// const StableTokenContract = artifacts.require('StableToken');
// const VaultAContract = artifacts.require('VaultA');
// const VaultBContract = artifacts.require('VaultB');
// const PegSettingsContract = artifacts.require('PegSettings');
// const PegLogicContract = artifacts.require('PegLogic');
// const OracleContract = artifacts.require('Oracle');
// const ContractIdsContract = artifacts.require('ContractIds');

module.exports = (deployer, network, accounts) => {
        // return deployer.deploy(CollateralTokenContract, 'Bancor Network Token', 'BNT', 18)
        //     .then(() => {
        //         return deployer.deploy(PEGUSDContract, 'PEG Network Token', 'PEG:USD', 18);
        //     })
        //     .then(() => {
        //         return deployer.deploy(StableTokenContract, 'Bancor USD Token', 'USDB', 18, InstanceRegistryContract.address);
        //     })
        //     .then(() => {
        //         return deployer.deploy(InstanceRegistryContract);
        //     })
        //     .then(() => {
        //         return deployer.deploy(VaultAContract, InstanceRegistryContract.address);
        //     })
        //     .then(() => {
        //         return deployer.deploy(VaultBContract, InstanceRegistryContract.address);
        //     })
        //     .then(() => {
        //         return deployer.deploy(PegSettingsContract, InstanceRegistryContract.address);
        //     })
        //     .then(() => {
        //         return deployer.deploy(PegLogicContract, InstanceRegistryContract.address);
        //     })
        //     .then(() => {
        //         return deployer.deploy(OracleContract);
        //     })
        //     .then(() => {
        //         return deployer.deploy(ContractIdsContract);
        //     })

       
        // await deployer.deploy(CollateralTokenContract, 'Bancor USD Token', 'USDB', 18, InstanceRegistryContract.address);
        // await deployer.deploy(PEGUSDContract, 'Bancor USD Token', 'USDB', 18, InstanceRegistryContract.address);        
        // await deployer.deploy(InstanceRegistryContract);
        // await deployer.deploy(StableTokenContract, 'Bancor USD Token', 'USDB', 18, InstanceRegistryContract.address);
        // await deployer.deploy(VaultAContract, InstanceRegistryContract.address);
        // await deployer.deploy(VaultBContract, InstanceRegistryContract.address);
        // await deployer.deploy(PegSettingsContract, InstanceRegistryContract.address);
        // await deployer.deploy(PegLogicContract, InstanceRegistryContract.address);
        // await deployer.deploy(OracleContract);
        // await deployer.deploy(ContractIdsContract);

        // let PegSettingsInstance = await PegSettingsContract.deployed();
        // let InstanceRegistryInstance = await InstanceRegistryContract.deployed();
        // let ContractIdsInstance = await ContractIdsContract.deployed();

        // await PegSettingsInstance.authorize(PegLogicContract.address, true);
        // await PegSettingsInstance.authorize(VaultAContract.address, true);
        // await PegSettingsInstance.authorize(VaultBContract.address, true);

        // console.log('here-----------', await ContractIdsInstance.COLLATERAL_TOKEN().call())

        // await InstanceRegistryInstance.registerAddress(
        //     await ContractIdsInstance.COLLATERAL_TOKEN(),
        //     CollateralTokenContract.address
        // );
        // await InstanceRegistryInstance.registerAddress(
        //     await ContractIdsInstance.PEGUSD_TOKEN(),
        //     PEGUSDContract.address
        // );
        // await InstanceRegistryInstance.registerAddress(
        //     await ContractIdsInstance.VAULT_A(),
        //     VaultAContract.address
        // );
        // await InstanceRegistryInstance.registerAddress(
        //     await ContractIdsInstance.VAULT_B(),
        //     VaultBContract.address
        // );
        // await InstanceRegistryInstance.registerAddress(
        //     await ContractIdsInstance.ORACLE(),
        //     OracleContract.address
        // );
        // await InstanceRegistryInstance.registerAddress(
        //     await ContractIdsInstance.PEG_SETTINGS(),
        //     PegSettingsContract.address
        // );
        // await InstanceRegistryInstance.registerAddress(
        //     await ContractIdsInstance.PEG_LOGIC(),
        //     PegLogicContract.address
        // );
        // await InstanceRegistryInstance.registerAddress(
        //     await ContractIdsInstance.FEE_RECIPIENT(),
        //     accounts[0]
        // );
};