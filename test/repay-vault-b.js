const utils = require('./utils');

contract("repay vault B test", (accounts) => {

    const BNT_toBorrow = 1000;
    const PEGUSD_toBorrow = 100;

    before(async () => {
        contracts = await utils.contracts(accounts);
        PegLogicContract = contracts.BUSD_Contracts.pegLogic;
        LogicActionsContract = contracts.BUSD_Contracts.logicActions;
        VaultAContract = contracts.BUSD_Contracts.vaultA;
        VaultBContract = contracts.BUSD_Contracts.vaultB;
        StableTokenContract = contracts.BUSD_Contracts.stableToken;
        BNTTokenContract = contracts.CollateralTokenContract;
        PEGUSDTokenContract = contracts.PEGUSDTokenContract;

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
        let balance = Number(await PEGUSDTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(balance, 0, 'Incorrect initial user collateral token balance');
        await PEGUSDTokenContract.issue(borrowerVaultB, PEGUSD_toBorrow * 1e18);
        balance = Number(await PEGUSDTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(balance / 1e18, PEGUSD_toBorrow, 'Incorrect user collateral token balance');

        await PEGUSDTokenContract.approve(LogicActionsContract.address, 0, {from: borrowerVaultB});
        await PEGUSDTokenContract.approve(LogicActionsContract.address, PEGUSD_toBorrow * 1e18, {from: borrowerVaultB});

        await LogicActionsContract.deposit(VaultBContract.address, PEGUSD_toBorrow * 1e18, {from: borrowerVaultB});
        balance = Number(await PEGUSDTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(balance, 0, 'Incorrect user collateral token balance after deposit');

        assert.equal(await VaultBContract.vaultExists.call(borrowerVaultB), true, 'vault does not exist');
        assert.equal((await VaultBContract.getVaults.call()).length, 1, 'Incorrect vaults count');
        assert.equal(Number(await PEGUSDTokenContract.balanceOf.call(VaultBContract.address)) / 1e18, PEGUSD_toBorrow, 'Incorrect vault contract collateral token balance');
        assert.equal(Number(await VaultBContract.rawBalanceOf.call(borrowerVaultB)) / 1e18, PEGUSD_toBorrow, 'Incorrect vault collateral balance');
    });

    it("should borrow debt token from vault B", async () => {
        vaultA_initial_BNTBalance = Number(await BNTTokenContract.balanceOf.call(VaultAContract.address));

        assert.equal(true, await VaultBContract.vaultExists.call(borrowerVaultB), 'vault does not exists');
        borrowerB_BNTBalance = Number(await BNTTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(borrowerB_BNTBalance, 0, 'incorrect borrower initial debt token balance');
        totalCredit = Number(await PegLogicContract.availableCredit.call(VaultBContract.address, borrowerVaultB));
        amountBorrowed = (totalCredit * 0.95);
        assert.isAbove(totalCredit, amountBorrowed, 'total credit is below amount to be borrowed');
        await LogicActionsContract.borrow(VaultBContract.address, amountBorrowed, {
            from: borrowerVaultB
        });
        let newAvailableCredit = Number(await PegLogicContract.availableCredit.call(VaultBContract.address, borrowerVaultB));
        assert.equal(newAvailableCredit, (totalCredit * 0.05), "wrong newAvailableCredit");
        borrowerB_BNTBalance = Number(await BNTTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(borrowerB_BNTBalance, amountBorrowed, 'debt token balance is not equal to what is borrowed');
        assert.equal(amountBorrowed, Number(await PegLogicContract.actualDebt.call(VaultBContract.address, borrowerVaultB)), 'actual debt is not equal to what is borrowed');
        assert.equal(amountBorrowed, Number(await VaultBContract.totalBorrowed.call(borrowerVaultB)), 'vault total borrowed is not equal to what is borrowed');

        vaultA_final_BNTBalance = Number(await BNTTokenContract.balanceOf.call(VaultAContract.address));
        assert.equal(vaultA_final_BNTBalance, vaultA_initial_BNTBalance - amountBorrowed, 'Incorrect vault A final debt token balance');
    });

    it('should repay portion of debt', async () => {
        vaultA_InitialCollateralTokenBalance = Number(await BNTTokenContract.balanceOf.call(VaultAContract.address));

        let totalBorrowedBefore = Number(await VaultBContract.totalBorrowed.call(borrowerVaultB));
        let amountToPay = totalBorrowedBefore * 0.40;

        await BNTTokenContract.approve(LogicActionsContract.address, 0, {from: borrowerVaultB});
        await BNTTokenContract.approve(LogicActionsContract.address, amountToPay, {from: borrowerVaultB});
        
        await LogicActionsContract.repay(VaultBContract.address, borrowerVaultB, amountToPay, {
            from: borrowerVaultB
        });
        
        let borrowerB_new_BNTBalance = Number(await BNTTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(borrowerB_new_BNTBalance, borrowerB_BNTBalance - amountToPay, 'incorrect user debt token balance');

        let totalBorrowedAfter = Number(await VaultBContract.totalBorrowed.call(borrowerVaultB));
        assert.equal(totalBorrowedAfter, totalBorrowedBefore - amountToPay, 'incorrect user total borrowed value');

        vaultA_FinalCollateralTokenBalance = Number(await BNTTokenContract.balanceOf.call(VaultAContract.address));
        assert.equal(vaultA_FinalCollateralTokenBalance, vaultA_InitialCollateralTokenBalance + amountToPay, 'Incorrect vault A final collateral token balance');
    });

    it('should repay entire debt', async () => {
        await BNTTokenContract.issue(borrowerVaultB, 1e18);
        vaultA_InitialCollateralTokenBalance = Number(await BNTTokenContract.balanceOf.call(VaultAContract.address));
        let borrowerB_initial_DebtTokenBalance = Number(await BNTTokenContract.balanceOf.call(borrowerVaultB));

        let debt = Number(await PegLogicContract.actualDebt.call(VaultBContract.address, borrowerVaultB));
        let amountToPay = debt;

        await BNTTokenContract.approve(LogicActionsContract.address, 0, {from: borrowerVaultB});
        await BNTTokenContract.approve(LogicActionsContract.address, Number(await BNTTokenContract.balanceOf.call(borrowerVaultB)), {from: borrowerVaultB});

        await LogicActionsContract.repayAll(VaultBContract.address, borrowerVaultB, {
            from: borrowerVaultB
        });
        
        let borrowerB_final_DebtTokenBalance = Number(await BNTTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(borrowerB_final_DebtTokenBalance, borrowerB_initial_DebtTokenBalance - amountToPay, 'incorrect user debt token balance');

        let debtAfter = Number(await PegLogicContract.actualDebt.call(VaultBContract.address, borrowerVaultB));
        assert.equal(debtAfter, 0, 'incorrect user actual debt value');

        vaultA_FinalCollateralTokenBalance = Number(await BNTTokenContract.balanceOf.call(VaultAContract.address));
        assert.equal(vaultA_FinalCollateralTokenBalance, vaultA_InitialCollateralTokenBalance + amountToPay, 'Incorrect vault A final collateral token balance');

        assert.equal(0, Number(await VaultBContract.totalBorrowed.call(borrowerVaultB)), 'incorrect total borrowed');
        assert.equal(0, Number(await VaultBContract.rawDebt.call(borrowerVaultB)), 'incorrect raw debt');

    });

})