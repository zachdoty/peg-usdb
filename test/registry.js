const utils = require('./utils');

contract("Registry test", (accounts) => {
    
    before(async () => {
        contracts = await utils.contracts(accounts);
    });

    it("should have correct addresses", async() => {
        assert.equal(
            contracts.CollateralTokenContract.address,
            await contracts.RegistryContract.addressOf(
                await contracts.ContractIdsContract.COLLATERAL_TOKEN.call()
            ),
            "Incorrect collateral token address"
        )
        assert.equal(
            contracts.PEGUSDTokenContract.address,
            await contracts.RegistryContract.addressOf(
                await contracts.ContractIdsContract.PEGUSD_TOKEN.call()
            ),
            "Incorrect PEGUSD token address"
        )
    });

})