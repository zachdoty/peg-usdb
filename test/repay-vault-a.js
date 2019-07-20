const utils = require('./utils');

contract("repay vault A test", (accounts) => {

    before(async () => {
        contracts = await utils.contracts(accounts);
        PegLogicContract = contracts.BUSD_Contracts.pegLogic;
        LogicActionsContract = contracts.BUSD_Contracts.logicActions;
        VaultContract = contracts.BUSD_Contracts.vaultA;
        StableTokenContract = contracts.BUSD_Contracts.stableToken;
        admin = accounts[0];
        vault = accounts[1];
        user = accounts[1];
    });

    it("should create new vault && fund collateral tokens to vault", async () => {
        let balance = Number(await contracts.CollateralTokenContract.balanceOf.call(vault));
        assert.equal(balance, 0, 'Incorrect initial user collateral token balance');
        await contracts.CollateralTokenContract.issue(vault, 100 * 1e18);
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

    it("should borrow debt token from vault", async () => {
        assert.equal(true, await VaultContract.vaultExists.call(vault), 'vault does not exists');
        userStableTokenBalance = Number(await StableTokenContract.balanceOf.call(user));
        assert.equal(userStableTokenBalance, 0, 'incorrect user initial stable token balance');
        totalCredit = Number(await PegLogicContract.availableCredit.call(VaultContract.address, vault));
        amountBorrowed = (totalCredit * 0.95);
        assert.isAbove(totalCredit, amountBorrowed, 'total credit is below amount to be borrowed');
        await LogicActionsContract.borrow(VaultContract.address, amountBorrowed, {
            from: user
        });
        let newAvailableCredit = Number(await PegLogicContract.availableCredit.call(VaultContract.address, vault));
        assert.equal(newAvailableCredit, (totalCredit * 0.05), "wrong newAvailableCredit");
        userStableTokenBalance = Number(await StableTokenContract.balanceOf.call(user));
        assert.equal(userStableTokenBalance, amountBorrowed, 'stable token balance is not equal to what is borrowed');
        assert.equal(amountBorrowed, Number(await PegLogicContract.actualDebt.call(VaultContract.address, vault)), 'actual debt is not equal to what is borrowed');
        assert.equal(amountBorrowed, Number(await VaultContract.totalBorrowed.call(vault)), 'vault total borrowed is not equal to what is borrowed');
    });

    it('should repay portion of debt', async () => {
        let totalBorrowedBefore = Number(await VaultContract.totalBorrowed.call(vault));
        let debt = Number(await PegLogicContract.actualDebt.call(VaultContract.address, vault));
        let amountToPay = debt * 0.40;
        let debtBalance = debt - amountToPay;
        await LogicActionsContract.repay(VaultContract.address, vault, amountToPay, {
            from: user
        });
        assert.equal(debtBalance, Number(await PegLogicContract.actualDebt.call(VaultContract.address, vault)), 'incorrect actual debt value');
        let userNewStableTokenBalance = Number(await StableTokenContract.balanceOf.call(user));
        assert.equal(userNewStableTokenBalance, userStableTokenBalance - amountToPay, 'incorrect user stable token balance');
        let totalBorrowedAfter = Number(await VaultContract.totalBorrowed.call(vault));
        assert.equal(totalBorrowedAfter, totalBorrowedBefore - amountToPay, 'incorrect user total borrowed value');
    });

    it('should repay entire debt', async () => {
        userStableTokenBalance = Number(await StableTokenContract.balanceOf.call(user));
        let debt = Number(await PegLogicContract.actualDebt.call(VaultContract.address, vault));
        await LogicActionsContract.repay(VaultContract.address, vault, debt, {
            from: user
        });
        assert.equal(0, Number(await PegLogicContract.actualDebt.call(VaultContract.address, vault)), 'incorrect actual debt value');
        let userNewStableTokenBalance = Number(await StableTokenContract.balanceOf.call(user));
        assert.equal(userNewStableTokenBalance, userStableTokenBalance - debt, 'incorrect user stable token balance');
        let totalBorrowed = Number(await VaultContract.totalBorrowed.call(vault));
        assert.equal(totalBorrowed, 0, 'incorrect user total borrowed value');
    });

});