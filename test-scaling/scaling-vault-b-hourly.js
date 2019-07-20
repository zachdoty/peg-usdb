const utils = require('./utils');

contract("scaling vault B test", (accounts) => {

    const BNT_toBorrow = 1000;
    const PEGUSD_toBorrow = 2000;

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

        // console.log('vault A debtScalePrevious before: ', Number(await VaultAContract.debtScalePrevious.call()));
        // console.log('vault A debtScaleTimestamp before: ', Number(await VaultAContract.debtScaleTimestamp.call()));
        // console.log('vault A debtScaleRate before: ', Number(await VaultAContract.debtScaleRate.call()));
        // console.log("**************")
        // console.log('vault A balScalePrevious before: ', Number(await VaultAContract.balScalePrevious.call()));
        // console.log('vault A balScaleTimestamp before: ', Number(await VaultAContract.balScaleTimestamp.call()));
        // console.log('vault A balScaleRate before: ', Number(await VaultAContract.balScaleRate.call()));

        // console.log("\n\n")

        // console.log('vault B debtScalePrevious before: ', Number(await VaultBContract.debtScalePrevious.call()));
        // console.log('vault B debtScaleTimestamp before: ', Number(await VaultBContract.debtScaleTimestamp.call()));
        // console.log('vault B debtScaleRate before: ', Number(await VaultBContract.debtScaleRate.call()));
        // console.log("**************")
        // console.log('vault B balScalePrevious before: ', Number(await VaultBContract.balScalePrevious.call()));
        // console.log('vault B balScaleTimestamp before: ', Number(await VaultBContract.balScaleTimestamp.call()));
        // console.log('vault B balScaleRate before: ', Number(await VaultBContract.balScaleRate.call()));


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

        // console.log("\n\n")
        

        // console.log('vault A debtScalePrevious after: ', Number(await VaultAContract.debtScalePrevious.call()));
        // console.log('vault A debtScaleTimestamp after: ', Number(await VaultAContract.debtScaleTimestamp.call()));
        // console.log('vault A debtScaleRate after: ', Number(await VaultAContract.debtScaleRate.call()));
        // console.log("**************")
        // console.log('vault A balScalePrevious after: ', Number(await VaultAContract.balScalePrevious.call()));
        // console.log('vault A balScaleTimestamp after: ', Number(await VaultAContract.balScaleTimestamp.call()));
        // console.log('vault A balScaleRate after: ', Number(await VaultAContract.balScaleRate.call()));

        // console.log("\n\n")

        // console.log('vault B debtScalePrevious after: ', Number(await VaultBContract.debtScalePrevious.call()));
        // console.log('vault B debtScaleTimestamp after: ', Number(await VaultBContract.debtScaleTimestamp.call()));
        // console.log('vault B debtScaleRate after: ', Number(await VaultBContract.debtScaleRate.call()));
        // console.log("**************")
        // console.log('vault B balScalePrevious after: ', Number(await VaultBContract.balScalePrevious.call()));
        // console.log('vault B balScaleTimestamp after: ', Number(await VaultBContract.balScaleTimestamp.call()));
        // console.log('vault B balScaleRate after: ', Number(await VaultBContract.balScaleRate.call()));

        // console.log("\n\n")

        // console.log('ratioVaultABorrowed: ', Number(await PegLogicContract.ratioVaultABorrowed.call()));
        // const res = await PegLogicContract.getCollateralBorrowingRate.call();
        // console.log('getCollateralBorrowingRate: ', Number(res[0]), Number(res[1]));

        // console.log('\n')
        // console.log(`- Vault A depositor BNT Balance: ${Number(await PegLogicContract.actualBalance.call(VaultAContract.address, borrowerVaultA))/1e18}`);
        // console.log(`- Borrower Total Borrowed: ${Number(await VaultBContract.totalBorrowed.call(borrowerVaultB))/1e18}`);

    });

    it("should adjust debt stability fee", async() => {
        await PegLogicContract.adjustDebtStabilityFee(VaultBContract.address, true, {
            from: admin
        });
    });

    for(let i = 0; i < 52; i++) {
        it(`advance evm time ${i+1} week`, async () => {
            const seconds = 3600 * 24 * 7;
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
            console.group('\n');
                console.log(`- Vault A balanceScalingFactor: ${Number(await VaultAContract.balanceScalingFactor.call())/1e18}`);
                console.log(`- Vault A depositor BNT Balance: ${Number(await PegLogicContract.actualBalance.call(VaultAContract.address, borrowerVaultA))/1e18}`);
                console.log(`- Borrower Total Borrowed: ${Number(await VaultBContract.totalBorrowed.call(borrowerVaultB))/1e18}`);
                console.log(`- Debt Before: ${debtBefore/1e18}`);
                console.log(`- Debt After: ${debtAfter/1e18}`);
                const diff = debtAfter - debtBefore;
                console.log(`(debtAfter - debtBefore) / 3600: ${(diff)/3600}`)
            console.groupEnd('\n');
        });
    }

})