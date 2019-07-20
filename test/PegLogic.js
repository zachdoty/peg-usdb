const utils = require('./utils');

contract("Peg Logic test", (accounts) => {

    before(async () => {
        contracts = await utils.contracts(accounts);
        PegLogicContract = contracts.BUSD_Contracts.pegLogic;
        LogicActionsContract = contracts.BUSD_Contracts.logicActions;
        VaultContract = contracts.BUSD_Contracts.vaultA;
        admin = accounts[0];
        vault = accounts[1];
    });

    it("should be 1", async() => {
        assert.equal(1, 1, 'not equal')
    })

    it("should have correct initial values", async () => {
        assert.equal(await PegLogicContract.actualDebt.call(VaultContract.address, vault), 0, 'Incorrect initial debt value');
        assert.equal(await VaultContract.rawBalanceOf.call(vault), 0, 'Incorrect initial balance value');
        assert.equal(await VaultContract.totalBorrowed.call(vault), 0, 'Incorrect initial total borrowed value');
    });

    it("should create new vault && fund collateral tokens to vault", async () => {
        let balance = Number(await contracts.CollateralTokenContract.balanceOf.call(vault));
        assert.equal(balance, 0, 'Incorrect initial user collateral token balance');
        await contracts.CollateralTokenContract.issue(vault, web3.toWei('100', 'ether'));
        balance = Number(await contracts.CollateralTokenContract.balanceOf.call(vault));
        assert.equal(balance / 1e18, 100, 'Incorrect user collateral token balance');

        await contracts.CollateralTokenContract.approve(LogicActionsContract.address, 0, {from: vault});
        await contracts.CollateralTokenContract.approve(LogicActionsContract.address, 100 * 1e18, {from: vault});

        await LogicActionsContract.deposit(VaultContract.address, 100 * 1e18, {from: vault});
        balance = Number(await contracts.CollateralTokenContract.balanceOf.call(vault));
        assert.equal(balance, 0, 'Incorrect user collateral token balance after deposit');

        assert.equal(await VaultContract.vaultExists.call(vault), true, 'vault does not exist');
        assert.equal((await VaultContract.getVaults.call()).length, 1, 'Incorrect vaults count');
        assert.equal(Number(await contracts.CollateralTokenContract.balanceOf.call(VaultContract.address)) / 1e18, 100, 'Incorrect vault contract collateral token balance');
        assert.equal(Number(await VaultContract.rawBalanceOf.call(vault)) / 1e18, 100, 'Incorrect vault collateral balance');
    });

    it("should have correct total credit value", async () => {
        totalCredit = Number(await PegLogicContract.totalCredit.call(VaultContract.address, vault)) / 1e18;
        assert.equal(totalCredit, 100 * 0.5);
    });

    it("should have correct available credit value", async () => {
        let availableCredit = Number(await PegLogicContract.availableCredit.call(VaultContract.address, vault));
        assert.equal(availableCredit / 1e18, totalCredit);
    });

    it("should have correct required collateral amount", async () => {
        let minSafeBalance = Number(await PegLogicContract.minSafeBalance.call(VaultContract.address, vault));
        assert.equal(minSafeBalance / 1e18, 0);
    });

    it("should have correct excess collateral amount", async () => {
        let excessCollateral = Number(await PegLogicContract.excessCollateral.call(VaultContract.address, vault));
        assert.equal(excessCollateral / 1e18, 100);
    });

})