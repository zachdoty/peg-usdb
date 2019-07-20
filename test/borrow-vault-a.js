const utils = require('./utils');

contract("borrow vault A test", (accounts) => {

    before(async () => {
        contracts = await utils.contracts(accounts);
        PegLogicContract = contracts.BUSD_Contracts.pegLogic;
        LogicActionsContract = contracts.BUSD_Contracts.logicActions;
        VaultContract = contracts.BUSD_Contracts.vaultA;
        StableTokenContract = contracts.BUSD_Contracts.stableToken;
        admin = accounts[0];
        vault = accounts[1];
        user = accounts[1];
        user2 = accounts[2];
        user3 = accounts[3];
    });

    it("should have correct initial values", async () => {
        assert.equal(await PegLogicContract.actualDebt.call(VaultContract.address, vault), 0, 'Incorrect initial debt value');
        assert.equal(await VaultContract.rawBalanceOf.call(vault), 0, 'Incorrect initial balance value');
        assert.equal(await VaultContract.totalBorrowed.call(vault), 0, 'Incorrect initial total borrowed value');
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

    it("should borrow stable token from vault", async () => {
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

    it("should be able transfer stable token to another user using allowance", async () => {
        let amountToTransfer = userStableTokenBalance * 0.50;
        await StableTokenContract.approve(user2, amountToTransfer, { from: user });
        await StableTokenContract.transferFrom(user, user3, amountToTransfer, { from: user2 });
        let user_stableToken = Number(await StableTokenContract.balanceOf.call(user));
        let user3_stableToken = Number(await StableTokenContract.balanceOf.call(user3));
        assert.equal(user3_stableToken, amountToTransfer, 'incorrect user 3 stable token balance');
        assert.equal(user_stableToken, userStableTokenBalance - amountToTransfer, 'incorrect user stable token balance');
    });

})