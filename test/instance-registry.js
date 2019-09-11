const utils = require('./utils');

contract("Instance Registry test", (accounts) => {

    before(async () => {
        contracts = await utils.contracts(accounts);
    });

    it("should have correct addresses", async() => {
        assert.equal(
            contracts.USDB_Contracts.stableToken.address,
            await contracts.USDB_InstanceRegistryContract.addressOf(
                await contracts.ContractIdsContract.STABLE_TOKEN.call()
            ),
            "Incorrect stable token address"
        );
        assert.equal(
            contracts.CollateralTokenContract.address,
            await contracts.USDB_InstanceRegistryContract.addressOf(
                await contracts.ContractIdsContract.COLLATERAL_TOKEN.call()
            ),
            "Incorrect collateral token address"
        );
        assert.equal(
            contracts.PEGUSDTokenContract.address,
            await contracts.RegistryContract.addressOf(
                await contracts.ContractIdsContract.PEGUSD_TOKEN.call()
            ),
            "Incorrect PEGUSD token address"
        )
        assert.equal(
            contracts.USDB_Contracts.vaultA.address,
            await contracts.USDB_InstanceRegistryContract.addressOf(
                await contracts.ContractIdsContract.VAULT_A.call()
            ),
            "Incorrect vault A address"
        );
        assert.equal(
            contracts.USDB_Contracts.vaultB.address,
            await contracts.USDB_InstanceRegistryContract.addressOf(
                await contracts.ContractIdsContract.VAULT_B.call()
            ),
            "Incorrect vault B address"
        );
        assert.equal(
            contracts.USDB_Contracts.pegLogic.address,
            await contracts.USDB_InstanceRegistryContract.addressOf(
                await contracts.ContractIdsContract.PEG_LOGIC.call()
            ),
            "Incorrect peg logic address"
        );
        assert.equal(
            contracts.USDB_Contracts.logicActions.address,
            await contracts.USDB_InstanceRegistryContract.addressOf(
                await contracts.ContractIdsContract.PEG_LOGIC_ACTIONS.call()
            ),
            "Incorrect logic action address"
        );
        assert.equal(
            contracts.USDB_Contracts.auctionActions.address,
            await contracts.USDB_InstanceRegistryContract.addressOf(
                await contracts.ContractIdsContract.AUCTION_ACTIONS.call()
            ),
            "Incorrect auction action address"
        );
        assert.equal(
            contracts.USDB_Contracts.pegSettings.address,
            await contracts.USDB_InstanceRegistryContract.addressOf(
                await contracts.ContractIdsContract.PEG_SETTINGS.call()
            ),
            "Incorrect peg settings address"
        );
        assert.equal(
            contracts.USDB_Contracts.oracle.address,
            await contracts.USDB_InstanceRegistryContract.addressOf(
                await contracts.ContractIdsContract.ORACLE.call()
            ),
            "Incorrect oracle address"
        );
        assert.equal(
            contracts.ConverterContract.address,
            await contracts.USDB_InstanceRegistryContract.addressOf(
                await contracts.ContractIdsContract.FEE_RECIPIENT.call()
            ),
            "Incorrect fee recipient address"
        );
    });

})