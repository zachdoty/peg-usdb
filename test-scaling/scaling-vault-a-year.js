const utils = require("./utils");

contract("scaling vault A year test", accounts => {
    const AMOUNT = 10000;
    const AMOUNT_TO_BORROW = 1000;

    before(async () => {
        contracts = await utils.contracts(accounts);
        PegLogicContract = contracts.USDB_Contracts.pegLogic;
        LogicActionsContract = contracts.USDB_Contracts.logicActions;
        VaultContract = contracts.USDB_Contracts.vaultA;
        StableTokenContract = contracts.USDB_Contracts.stableToken;
        PegSettingsContract = contracts.USDB_Contracts.pegSettings;
        admin = accounts[0];
        vault = accounts[1];
        user = accounts[1];
        liquidator = accounts[2];
    });

    it("should have correct initial values", async () => {
        assert.equal(await PegLogicContract.actualDebt.call(VaultContract.address, vault), 0, "Incorrect initial debt value");
        assert.equal(await VaultContract.rawBalanceOf.call(vault), 0, "Incorrect initial balance value");
        assert.equal(await VaultContract.totalBorrowed.call(vault), 0, "Incorrect initial total borrowed value");
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

    it("should adjust debt stability fee", async () => {
        await PegLogicContract.adjustDebtStabilityFee(VaultContract.address, true, {
            from: admin
        });
    });

    it(`advance evm time 1 year`, async () => {
        const seconds = 3600 * 24 * 365;
        const debtBefore = Number(await PegLogicContract.actualDebt.call(VaultContract.address, vault));
        const initialBlock = web3.eth.blockNumber;
        const initialTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [seconds], // 1 hour
            id: Date.now() + 1
        });
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: Date.now() + 2
        });
        const laterBlock = web3.eth.blockNumber;
        const laterTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        assert(initialTime + seconds <= laterTime, "evm time not advanced");
        assert.isBelow(initialBlock, laterBlock, "initialBlock is above laterBlock");
        const debtAfter = Number(await PegLogicContract.actualDebt.call(VaultContract.address, vault));
        assert.isBelow(debtBefore, debtAfter, "debtBefore is above debtAfter");
    });

    it("should process stability fee", async () => {
        let mintableAmount = Number(await PegLogicContract.mintableAmount.call(VaultContract.address));
        await PegLogicContract.processStabilityFee(VaultContract.address, {
            from: admin
        });
        assert.equal(Number(await VaultContract.amountMinted.call()), mintableAmount, 'amount minted is not equal to mintable amount');
        assert.equal(Number(await StableTokenContract.balanceOf.call(contracts.ConverterContract.address)), mintableAmount, 'incorrect stable token balance of stability fee recipient');
        mintableAmount = Number(await PegLogicContract.mintableAmount.call(VaultContract.address));
        assert.equal(mintableAmount, 0, 'mintable amount is not equal to 0');
    });
});
