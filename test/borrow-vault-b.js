const utils = require('./utils');

contract("borrow vault B test", (accounts) => {

    const BNT_toBorrow = 1000;
    const BUSD_toBorrow = 100;

    before(async () => {
        contracts = await utils.contracts(accounts);
        PegLogicContract = contracts.BUSD_Contracts.pegLogic;
        LogicActionsContract = contracts.BUSD_Contracts.logicActions;
        VaultAContract = contracts.BUSD_Contracts.vaultA;
        VaultBContract = contracts.BUSD_Contracts.vaultB;
        StableTokenContract = contracts.BUSD_Contracts.stableToken;
        BNTTokenContract = contracts.CollateralTokenContract;

        admin = accounts[0];
        borrowerVaultA = accounts[1];
        borrowerVaultB = accounts[2];

    });

    it("should have correct initial values", async () => {
        assert.equal(await PegLogicContract.actualDebt.call(VaultAContract.address, borrowerVaultA), 0, 'Incorrect borrower vaultA initial debt value');
        assert.equal(await PegLogicContract.actualDebt.call(VaultBContract.address, borrowerVaultB), 0, 'Incorrect borrower vaultB initial debt value');
        assert.equal(await VaultAContract.rawBalanceOf.call(borrowerVaultA), 0, 'Incorrect borrower vaultA initial balance value');
        assert.equal(await VaultAContract.totalBorrowed.call(borrowerVaultA), 0, 'Incorrect borrower vaultA initial total borrowed value');
        assert.equal(await VaultBContract.rawBalanceOf.call(borrowerVaultB), 0, 'Incorrect borrower vaultB initial balance value');
        assert.equal(await VaultBContract.totalBorrowed.call(borrowerVaultB), 0, 'Incorrect borrower vaultB initial total borrowed value');
    });

    it("should create new vault && fund collateral tokens to vault A", async () => {
        let balance = Number(await BNTTokenContract.balanceOf.call(borrowerVaultA));
        assert.equal(balance, 0, 'Incorrect initial user collateral token balance');
        await BNTTokenContract.issue(borrowerVaultA, BNT_toBorrow * 1e18);
        balance = Number(await BNTTokenContract.balanceOf.call(borrowerVaultA));
        assert.equal(balance / 1e18, BNT_toBorrow, 'Incorrect user collateral token balance');

        await BNTTokenContract.approve(LogicActionsContract.address, 0, {from: borrowerVaultA});
        await BNTTokenContract.approve(LogicActionsContract.address, BNT_toBorrow * 1e18, {from: borrowerVaultA});

        await LogicActionsContract.deposit(VaultAContract.address, BNT_toBorrow * 1e18, {from: borrowerVaultA});
        balance = Number(await BNTTokenContract.balanceOf.call(borrowerVaultA));
        assert.equal(balance, 0, 'Incorrect user collateral token balance after deposit');

        assert.equal(await VaultAContract.vaultExists.call(borrowerVaultA), true, 'vault does not exist');
        assert.equal((await VaultAContract.getVaults.call()).length, 1, 'Incorrect vaults count');
        assert.equal(Number(await BNTTokenContract.balanceOf.call(VaultAContract.address)) / 1e18, BNT_toBorrow, 'Incorrect vault contract collateral token balance');
        assert.equal(Number(await VaultAContract.rawBalanceOf.call(borrowerVaultA)) / 1e18, BNT_toBorrow, 'Incorrect vault collateral balance');
    });

    it("should create new vault && fund collateral tokens to vault B", async () => {
        let balance = Number(await StableTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(balance, 0, 'Incorrect initial user collateral token balance');
        await StableTokenContract.issue(borrowerVaultB, BUSD_toBorrow * 1e18);
        balance = Number(await StableTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(balance / 1e18, BUSD_toBorrow, 'Incorrect user collateral token balance');

        await StableTokenContract.approve(LogicActionsContract.address, 0, {from: borrowerVaultB});
        await StableTokenContract.approve(LogicActionsContract.address, BUSD_toBorrow * 1e18, {from: borrowerVaultB});

        await LogicActionsContract.deposit(VaultBContract.address, BUSD_toBorrow * 1e18, {from: borrowerVaultB});
        balance = Number(await StableTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(balance, 0, 'Incorrect user collateral token balance after deposit');

        assert.equal(await VaultBContract.vaultExists.call(borrowerVaultB), true, 'vault does not exist');
        assert.equal((await VaultBContract.getVaults.call()).length, 1, 'Incorrect vaults count');
        assert.equal(Number(await StableTokenContract.balanceOf.call(VaultBContract.address)) / 1e18, BUSD_toBorrow, 'Incorrect vault contract collateral token balance');
        assert.equal(Number(await VaultBContract.rawBalanceOf.call(borrowerVaultB)) / 1e18, BUSD_toBorrow, 'Incorrect vault collateral balance');
    });

    it("should borrow debt token from vault B", async () => {
        vaultA_initial_BNTBalance = Number(await BNTTokenContract.balanceOf.call(VaultAContract.address));

        assert.equal(true, await VaultBContract.vaultExists.call(borrowerVaultB), 'vault does not exists');
        borrowerB_BNTBalance = Number(await BNTTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(borrowerB_BNTBalance, 0, 'incorrect borrower initial debt token balance');
        totalCredit = Number(await PegLogicContract.availableCredit.call(VaultBContract.address, borrowerVaultB));
        amountBorrowed = (totalCredit * 0.90);
        assert.isAbove(totalCredit, amountBorrowed, 'total credit is below amount to be borrowed');
        await LogicActionsContract.borrow(VaultBContract.address, amountBorrowed, {
            from: borrowerVaultB
        });
        let newAvailableCredit = Number(await PegLogicContract.availableCredit.call(VaultBContract.address, borrowerVaultB));
        assert.equal(newAvailableCredit, (totalCredit * 0.10), "wrong newAvailableCredit");
        borrowerB_BNTBalance = Number(await BNTTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(borrowerB_BNTBalance, amountBorrowed, 'debt token balance is not equal to what is borrowed');
        assert.equal(amountBorrowed, Number(await VaultBContract.totalBorrowed.call(borrowerVaultB)), 'vault total borrowed is not equal to what is borrowed');

        vaultA_final_BNTBalance = Number(await BNTTokenContract.balanceOf.call(VaultAContract.address));
        assert.equal(vaultA_final_BNTBalance, vaultA_initial_BNTBalance - amountBorrowed, 'Incorrect vault A final debt token balance');
    });

})