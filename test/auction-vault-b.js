const utils = require('./utils');
const Auction = artifacts.require("Auction");

contract("auction vault B test", (accounts) => {

    const BNT_toBorrow = 1000;
    const PEGUSD_toBorrow = 500;

    before(async () => {
        contracts = await utils.contracts(accounts);
        
        PegLogicContract = contracts.BUSD_Contracts.pegLogic;
        LogicActionsContract = contracts.BUSD_Contracts.logicActions;
        AuctionActionsContract = contracts.BUSD_Contracts.auctionActions;
        VaultAContract = contracts.BUSD_Contracts.vaultA;
        VaultBContract = contracts.BUSD_Contracts.vaultB;
        StableTokenContract = contracts.BUSD_Contracts.stableToken;
        OracleContract = contracts.BUSD_Contracts.oracle;
        CollateralTokenContract = contracts.CollateralTokenContract;
        DebtTokenContract = contracts.PEGUSDTokenContract;

        admin = accounts[0];
        borrowerVaultA = accounts[1];
        borrowerVaultB = accounts[2];
        bidders = [
            {
                amount: 10,
                address: accounts[3]
            },
            {
                amount: 20,
                address: accounts[4]
            },
            {
                amount: 20,
                address: accounts[5]
            },
        ];
    });

    it("should create new vault && fund collateral tokens to vault A", async () => {
        let balance = Number(await CollateralTokenContract.balanceOf.call(borrowerVaultA));
        assert.equal(balance, 0, 'Incorrect initial user collateral token balance');
        await CollateralTokenContract.issue(borrowerVaultA, BNT_toBorrow * 1e18);
        balance = Number(await CollateralTokenContract.balanceOf.call(borrowerVaultA));
        assert.equal(balance / 1e18, BNT_toBorrow, 'Incorrect user collateral token balance');

        await CollateralTokenContract.approve(LogicActionsContract.address, 0, {from: borrowerVaultA});
        await CollateralTokenContract.approve(LogicActionsContract.address, BNT_toBorrow * 1e18, {from: borrowerVaultA});

        await LogicActionsContract.deposit(VaultAContract.address, BNT_toBorrow * 1e18, {from: borrowerVaultA});
        balance = Number(await CollateralTokenContract.balanceOf.call(borrowerVaultA));
        assert.equal(balance, 0, 'Incorrect user collateral token balance after deposit');

        assert.equal(await VaultAContract.vaultExists.call(borrowerVaultA), true, 'vault does not exist');
        assert.equal((await VaultAContract.getVaults.call()).length, 1, 'Incorrect vaults count');
        assert.equal(Number(await CollateralTokenContract.balanceOf.call(VaultAContract.address)) / 1e18, BNT_toBorrow, 'Incorrect vault contract collateral token balance');
        assert.equal(Number(await VaultAContract.rawBalanceOf.call(borrowerVaultA)) / 1e18, BNT_toBorrow, 'Incorrect vault collateral balance');
    });

    it("should create new vault && fund collateral tokens to vault B", async () => {
        let balance = Number(await DebtTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(balance, 0, 'Incorrect initial user collateral token balance');
        await DebtTokenContract.issue(borrowerVaultB, PEGUSD_toBorrow * 1e18);
        balance = Number(await DebtTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(balance / 1e18, PEGUSD_toBorrow, 'Incorrect user collateral token balance');

        await DebtTokenContract.approve(LogicActionsContract.address, 0, {from: borrowerVaultB});
        await DebtTokenContract.approve(LogicActionsContract.address, PEGUSD_toBorrow * 1e18, {from: borrowerVaultB});

        await LogicActionsContract.deposit(VaultBContract.address, PEGUSD_toBorrow * 1e18, {from: borrowerVaultB});
        balance = Number(await DebtTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(balance, 0, 'Incorrect user collateral token balance after deposit');

        assert.equal(await VaultBContract.vaultExists.call(borrowerVaultB), true, 'vault does not exist');
        assert.equal((await VaultBContract.getVaults.call()).length, 1, 'Incorrect vaults count');
        assert.equal(Number(await DebtTokenContract.balanceOf.call(VaultBContract.address)) / 1e18, PEGUSD_toBorrow, 'Incorrect vault contract collateral token balance');
        assert.equal(Number(await VaultBContract.rawBalanceOf.call(borrowerVaultB)) / 1e18, PEGUSD_toBorrow, 'Incorrect vault collateral balance');
    });

    it("should borrow debt token from vault B", async () => {
        vaultA_initial_BNTBalance = Number(await CollateralTokenContract.balanceOf.call(VaultAContract.address));

        assert.equal(true, await VaultBContract.vaultExists.call(borrowerVaultB), 'vault does not exists');
        borrowerB_BNTBalance = Number(await CollateralTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(borrowerB_BNTBalance, 0, 'incorrect borrower initial debt token balance');
        totalCredit = Number(await PegLogicContract.availableCredit.call(VaultBContract.address, borrowerVaultB));
        amountBorrowed = totalCredit;
        assert(totalCredit >= amountBorrowed, 'total credit is below amount to be borrowed');
        await LogicActionsContract.borrow(VaultBContract.address, amountBorrowed, {
            from: borrowerVaultB
        });
        borrowerB_BNTBalance = Number(await CollateralTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(borrowerB_BNTBalance, amountBorrowed, 'debt token balance is not equal to what is borrowed');
        assert.equal(amountBorrowed, Number(await VaultBContract.totalBorrowed.call(borrowerVaultB)), 'vault total borrowed is not equal to what is borrowed');

        vaultA_final_BNTBalance = Number(await CollateralTokenContract.balanceOf.call(VaultAContract.address));
        assert.equal(vaultA_final_BNTBalance, vaultA_initial_BNTBalance - amountBorrowed, 'Incorrect vault A final debt token balance');
    });

    it("should issue debt tokens to bidders", async () => {
        await CollateralTokenContract.issue(bidders[0].address, BNT_toBorrow * 1e18);
        assert.equal(BNT_toBorrow, Number(await CollateralTokenContract.balanceOf.call(bidders[0].address)) / 1e18);
        await CollateralTokenContract.issue(bidders[1].address, BNT_toBorrow * 1e18);
        assert.equal(BNT_toBorrow, Number(await CollateralTokenContract.balanceOf.call(bidders[1].address)) / 1e18);
        await CollateralTokenContract.issue(bidders[2].address, BNT_toBorrow * 1e18);
        assert.equal(BNT_toBorrow, Number(await CollateralTokenContract.balanceOf.call(bidders[2].address)) / 1e18);
    });

    it("should throw error when vault is not yet for liquidation", async () => {
        assert.equal(await PegLogicContract.isInsolvent.call(VaultBContract.address, borrowerVaultB), false, 'vault is for liquidation now');
        debt = Number(await PegLogicContract.actualDebt.call(VaultBContract.address, borrowerVaultB));
        assert.isAbove(debt, 0, 'incorrect debt value');
        assert.equal(true, await VaultBContract.vaultExists.call(borrowerVaultB), 'vault does not exist');
        try {
            await AuctionActionsContract.startAuction(VaultBContract.address, borrowerVaultB, { from: admin });
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it("should trigger auction state when oracle price change very high", async () => {
        let price = Number(await VaultBContract.oracleValue.call());
        let newPrice = price + (price * 0.90);
        await OracleContract.updateValue(newPrice, {
            from: admin
        });
        await OracleContract.confirmValueUpdate({
            from: admin
        });
        oraclePrice = Number(await OracleContract.getValue.call());
        assert.equal(oraclePrice, newPrice, "wrong oracle price");
        assert.equal(await PegLogicContract.isInsolvent.call(VaultBContract.address, borrowerVaultB), true, 'vault is not yet for liquidation');
    });

    it("should be able to start auction of vault", async () => {
        rawBalanceOf = Number(await VaultBContract.rawBalanceOf.call(borrowerVaultB));
        rawDebt = Number(await VaultBContract.rawDebt.call(borrowerVaultB));
        totalBorrowed = Number(await VaultBContract.totalBorrowed.call(borrowerVaultB));
        actualDebt = Number(await PegLogicContract.actualDebt.call(VaultBContract.address, borrowerVaultB));
        assert.isAbove(actualDebt, 0, 'incorrect debt value');
        assert.equal(await PegLogicContract.isInsolvent.call(VaultBContract.address, borrowerVaultB), true, 'vault is not for auction so far');

        await AuctionActionsContract.startAuction(VaultBContract.address, borrowerVaultB, { from: admin });
        auctionAddress = await VaultBContract.auctions.call(borrowerVaultB);
        assert(utils.zeroAddress != auctionAddress, 'vault auction address does not exist');

        assert.equal(rawBalanceOf, Number(await VaultBContract.rawBalanceOf.call(auctionAddress)), 'incorrect auction contract raw balance value');
        assert.equal(rawDebt, Number(await VaultBContract.rawDebt.call(auctionAddress)), 'incorrect auction contract raw debt value');
        assert.equal(totalBorrowed, Number(await VaultBContract.totalBorrowed.call(auctionAddress)), 'incorrect auction contract raw debt value');
        
        assert.equal(0, Number(await VaultBContract.rawBalanceOf.call(borrowerVaultB)), 'incorrect borrower raw balance value');
        assert.equal(0, Number(await VaultBContract.rawDebt.call(borrowerVaultB)), 'incorrect borrower raw debt value');
        assert.equal(0, Number(await VaultBContract.totalBorrowed.call(borrowerVaultB)), 'incorrect borrower raw debt value');
        assert.equal(0, Number(await PegLogicContract.actualDebt.call(VaultBContract.address, borrowerVaultB)), 'incorrect borrower debt value');

        AuctionContract = await Auction.at(auctionAddress);
        assert.equal(0, Number(await AuctionContract.auctionEndTime.call()), 'incorrect auction time');
    });

    it("should place bid, enabled auction time and pay the auction debt", async () => {
        let vaultAInitialCollateralToken = Number(await CollateralTokenContract.balanceOf.call(VaultAContract.address));

        auctionActualDebt = Number(await PegLogicContract.actualDebt.call(VaultBContract.address, AuctionContract.address));
        assert.equal(Number(await AuctionContract.highestBid.call())/1e18, 0, 'incorrect auction initial highest bid amount');
        let bidAmount = bidders[0].amount;
        let bidder = bidders[0].address;
        lastBidder = bidders[0].address;

        await CollateralTokenContract.approve(AuctionContract.address, auctionActualDebt + (auctionActualDebt * 0.50), {from:bidder});
        let res = await AuctionContract.bid(bidAmount*1e18, {from: bidder});
        assert(res.logs.length > 0 && res.logs[0].event == 'HighestBidIncreased', 'incorrect event name');
        assert.equal(res.logs[0].args._bidder.toLowerCase(), bidder.toLowerCase(), 'incorrect event bidder address');
        assert.equal(Number(res.logs[0].args._amount)/1e18, bidAmount, 'incorrect event bid amount');
        assert.equal((await AuctionContract.highestBidder.call()).toLowerCase(), bidder.toLowerCase(), 'incorrect auction highest bidder address');
        assert.equal(Number(await AuctionContract.highestBid.call())/1e18, bidAmount, 'incorrect auction highest bid amount');

        assert.equal(rawBalanceOf, Number(await VaultBContract.rawBalanceOf.call(auctionAddress)), 'incorrect auction contract raw balance value');
        assert.equal(0, Number(await VaultBContract.rawDebt.call(auctionAddress)), 'incorrect auction contract raw debt value');
        assert.equal(0, Number(await VaultBContract.totalBorrowed.call(auctionAddress)), 'incorrect auction contract raw debt value');
        
        assert.isAbove(Number(await AuctionContract.auctionEndTime.call()), 0, 'incorrect auction time');
        assert.equal(Number(await CollateralTokenContract.balanceOf.call(AuctionContract.address)), 0, 'incorrect auction contract debt token balance');

        let vaultAFinalCollateralToken = Number(await CollateralTokenContract.balanceOf.call(VaultAContract.address));
        assert.equal(vaultAInitialCollateralToken + (auctionActualDebt), vaultAFinalCollateralToken, "incorrect vault A collateral token");

        lastBidderDebtTokenBalance = Number(await CollateralTokenContract.balanceOf.call(bidder));
    });

    it("should throw error when vault is on auction and tries to borrow", async () => {
        assert.equal(await PegLogicContract.isInsolvent.call(VaultBContract.address, borrowerVaultB), false, 'vault is not for liquidation so far');
        await DebtTokenContract.issue(borrowerVaultB, PEGUSD_toBorrow * 1e18);
        
        await DebtTokenContract.approve(LogicActionsContract.address, 0, {from: borrowerVaultB});
        await DebtTokenContract.approve(LogicActionsContract.address, PEGUSD_toBorrow * 1e18, {from: borrowerVaultB});

        await LogicActionsContract.deposit(VaultBContract.address, PEGUSD_toBorrow * 1e18, {from: borrowerVaultB});
        balance = Number(await DebtTokenContract.balanceOf.call(borrowerVaultB));
        assert.equal(balance, 0, 'Incorrect user debt token balance after deposit');

        totalCredit = Number(await PegLogicContract.availableCredit.call(VaultBContract.address, borrowerVaultB));
        amountBorrowed = totalCredit;
        assert(totalCredit >= amountBorrowed, 'total credit is below amount to be borrowed');
        assert.equal(AuctionContract.address, await VaultBContract.auctions.call(borrowerVaultB), 'incorrect auction address');
        try {
            await LogicActionsContract.borrow(VaultBContract.address, amountBorrowed, {
                from: borrowerVaultB
            });
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it("should outbid current highest bid and transfer previous bid token to previous highest bidder", async () => {
        let bidAmount = bidders[1].amount;
        let bidder = bidders[1].address;
        await CollateralTokenContract.approve(AuctionContract.address, auctionActualDebt + (auctionActualDebt * 0.50), {from:bidder});
        let res = await AuctionContract.bid(bidAmount*1e18, {from: bidder});
        assert(res.logs.length > 0 && res.logs[0].event == 'HighestBidIncreased', 'incorrect event name');
        assert.equal(res.logs[0].args._bidder.toLowerCase(), bidder.toLowerCase(), 'incorrect event bidder address');
        assert.equal(Number(res.logs[0].args._amount)/1e18, bidAmount, 'incorrect event bid amount');
        assert.equal((await AuctionContract.highestBidder.call()).toLowerCase(), bidder.toLowerCase(), 'incorrect auction highest bidder address');
        assert.equal(Number(await AuctionContract.highestBid.call())/1e18, bidAmount, 'incorrect auction highest bid amount');
        assert.equal(Number(await CollateralTokenContract.balanceOf.call(lastBidder)), (lastBidderDebtTokenBalance + auctionActualDebt), 'incorrect last bidder debt token balance');
    });

    it("should have throw error when calling bid with low or equal amount than current highest bid", async () => {
        try {
            let bidAmount = bidders[2].amount;
            let bidder = bidders[2].address;
            await CollateralTokenContract.approve(AuctionContract.address, auctionActualDebt, {from:bidder});
            await AuctionContract.bid(bidAmount * 1e18, {from: bidder});
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it("should have throw error when calling auction end before time is not due", async () => {
        try {
            await AuctionContract.auctionEnd();
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it(`should advance evm time 3 hours and 5 seconds`, async () => {
        const initialBlock = web3.eth.blockNumber;
        const initialTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [10805], // 1 hour
            id: Date.now() + 1
        });
        await web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: Date.now() + 2
        });
        const laterBlock = web3.eth.blockNumber;
        const laterTime = await web3.eth.getBlock(web3.eth.blockNumber).timestamp;
        assert((initialTime + 10805) <= laterTime, 'evm time not advanced');
        assert.isBelow(initialBlock, laterBlock, 'initialBlock is above laterBlock');
    });

    it("should end auction", async () => {
        let highestBid = Number(await AuctionContract.highestBid.call());
        let highestBidder = await AuctionContract.highestBidder.call();
    
        let rawBalanceOf_borrower_before = Number(await VaultBContract.rawBalanceOf.call(borrowerVaultB));
        let rawBalanceOf_bidder_before = Number(await VaultBContract.rawBalanceOf.call(highestBidder));
        let rawBalanceOf_auction = Number(await VaultBContract.rawBalanceOf.call(AuctionContract.address));
        
        await AuctionActionsContract.endAuction(VaultBContract.address, borrowerVaultB);
    
        let rawBalanceOf_borrower_after = Number(await VaultBContract.rawBalanceOf.call(borrowerVaultB));
        let rawBalanceOf_bidder_after = Number(await VaultBContract.rawBalanceOf.call(highestBidder));
        
        assert.equal(utils.zeroAddress, await VaultBContract.auctions.call(borrowerVaultB), 'auction address was not set to empty');
        assert.equal(rawBalanceOf_borrower_before + highestBid, rawBalanceOf_borrower_after, 'incorrect borrower raw balance value');
        assert.equal(rawBalanceOf_bidder_before + (rawBalanceOf_auction - highestBid), rawBalanceOf_bidder_after, 'incorrect bidder raw balance value');
    });

    it("should be able to borrow again", async () => {
        totalCredit = Number(await PegLogicContract.availableCredit.call(VaultBContract.address, borrowerVaultB));
        amountBorrowed = totalCredit;
        assert(totalCredit >= amountBorrowed, 'total credit is below amount to be borrowed');
        await LogicActionsContract.borrow(VaultBContract.address, amountBorrowed, {
            from: borrowerVaultB
        });
        assert.equal(amountBorrowed, Number(await VaultBContract.totalBorrowed.call(borrowerVaultB)), 'vault total borrowed is not equal to what is borrowed');
    });

})