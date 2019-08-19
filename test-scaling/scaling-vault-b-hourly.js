const utils = require('./utils');

contract("scaling vault B test", (accounts) => {

    const BNT_toBorrow = 1000;
    const BUSD_toBorrow = 2000;

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


    it("should create new vault && issue collateral tokens to vault B borrower", async () => {
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
        amountBorrowed = 50*1e18;
        assert.isAbove(totalCredit, amountBorrowed, 'total credit is below amount to be borrowed');
        await LogicActionsContract.borrow(VaultBContract.address, amountBorrowed, {
            from: borrowerVaultB
        });
        borrowerB_BNTBalance = Number(await BNTTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(borrowerB_BNTBalance, amountBorrowed, 'debt token balance is not equal to what is borrowed');
        assert.equal(amountBorrowed, Number(await VaultBContract.totalBorrowed.call(borrowerVaultB)), 'vault total borrowed is not equal to what is borrowed');
        vaultA_final_BNTBalance = Number(await BNTTokenContract.balanceOf.call(VaultAContract.address));
        assert.equal(vaultA_final_BNTBalance, vaultA_initial_BNTBalance - amountBorrowed, 'Incorrect vault A final debt token balance');

    });

    it("should adjust debt stability fee", async() => {
        await PegLogicContract.adjustDebtStabilityFee(VaultBContract.address, true, {
            from: admin
        });
    });

    for(let i = 0; i < 48; i++) {
        it(`advance evm time ${i+1} hour`, async () => {
            const seconds = 3600;
            const debtBefore = Number(await PegLogicContract.actualDebt.call(VaultBContract.address, borrowerVaultB));
            const initialBlock = web3.eth.blockNumber;
            const initialTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp;
            await web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_increaseTime",
                params: [seconds],
                id: Date.now() + 1
            });
            await web3.currentProvider.send({
                jsonrpc: "2.0",
                method: "evm_mine",
                id: Date.now() + 2
            });
            const laterBlock = web3.eth.blockNumber;
            const laterTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp;
            assert((initialTime + seconds) <= laterTime, 'evm time not advanced');
            assert.isBelow(initialBlock, laterBlock, 'initialBlock is above laterBlock');
            const debtAfter = Number(await PegLogicContract.actualDebt.call(VaultBContract.address, borrowerVaultB));
            assert.isBelow(debtBefore, debtAfter, 'debtBefore is above debtAfter');
        });
    }

})