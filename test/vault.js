const utils = require('./utils');
const Vault = artifacts.require('Vault');

contract("Vault Basic test", (accounts) => {

    before(async () => {
        contracts = await utils.contracts(accounts);
        VaultAContract = await Vault.at(
            await contracts.BUSD_InstanceRegistryContract.addressOf(
                await contracts.ContractIdsContract.VAULT_A.call()
            )
        )
        VaultBContract = await Vault.at(
            await contracts.BUSD_InstanceRegistryContract.addressOf(
                await contracts.ContractIdsContract.VAULT_B.call()
            )
        )
        admin = accounts[0];
        vault = accounts[1];
    });

    it("should have correct vault A initial values", async () => {
        assert.equal(await VaultAContract.rawBalanceOf.call(vault), 0, 'Incorrect initial raw balance');
        assert.equal(await VaultAContract.rawDebt.call(vault), 0, 'Incorrect initial raw debt');
        assert.equal(await VaultAContract.totalBorrowed.call(vault), 0, 'Incorrect initial total borrowed');

        assert.equal(await VaultAContract.rawTotalBalance.call(), 0, 'Incorrect initial raw total balance');
        assert.equal(await VaultAContract.rawTotalDebt.call(), 0, 'Incorrect initial raw total debt');
        assert.equal(await VaultAContract.collateralBorrowedRatio.call(), 0, 'Incorrect initial collateral borrowed ratio');
        assert.equal(await VaultAContract.amountMinted.call(), 0, 'Incorrect initial amount minted');
    });

    it("should have correct vault B initial values", async () => {
        assert.equal(await VaultBContract.rawBalanceOf.call(vault), 0, 'Incorrect initial raw balance');
        assert.equal(await VaultBContract.rawDebt.call(vault), 0, 'Incorrect initial raw debt');
        assert.equal(await VaultBContract.totalBorrowed.call(vault), 0, 'Incorrect initial total borrowed');

        assert.equal(await VaultBContract.rawTotalBalance.call(), 0, 'Incorrect initial raw total balance');
        assert.equal(await VaultBContract.rawTotalDebt.call(), 0, 'Incorrect initial raw total debt');
        assert.equal(await VaultBContract.collateralBorrowedRatio.call(), 0, 'Incorrect initial collateral borrowed ratio');
        assert.equal(await VaultBContract.amountMinted.call(), 0, 'Incorrect initial amount minted');
    });

    it("should create vault", async () => {
        assert.equal(await VaultAContract.vaultExists.call(vault), false, "vault already exist");
        let res = await VaultAContract.create(vault);
        assert.equal(await VaultAContract.vaultExists.call(vault), true, "vault don't exist");
        let vaults = await VaultAContract.getVaults();
        assert.equal(vaults.length, 1, 'incorrect vaults length');
        assert(res.logs.length > 0 && res.logs[0].event == 'Create');
        assert(res.logs.length > 0 && res.logs[0].args._borrower === vault);
    });

    it("should not create vault when vault already exists", async () => {
        assert.equal(await VaultAContract.vaultExists.call(vault), true, "vault don't exist");
        await VaultAContract.create(vault);
        let vaults = await VaultAContract.getVaults();
        assert.equal(vaults.length, 1, 'incorrect vaults length');
    });

    it("should throw error when sender is not authorized", async () => {
        try {
            await VaultAContract.create(accounts[8], {from: accounts[8]});
        } catch (error) {
            return utils.ensureException(error);
        }
    });

})