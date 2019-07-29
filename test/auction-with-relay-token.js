const utils = require('./utils');
const Auction = artifacts.require("Auction");

contract("auction with relay token on vault A test", (accounts) => {

    before(async () => {
        contracts = await utils.contracts(accounts);
        PegLogicContract = contracts.BUSD_Contracts.pegLogic;
        LogicActionsContract = contracts.BUSD_Contracts.logicActions;
        AuctionActionsContract = contracts.BUSD_Contracts.auctionActions;
        VaultContract = contracts.BUSD_Contracts.vaultA;
        StableTokenContract = contracts.BUSD_Contracts.stableToken;
        OracleContract = contracts.BUSD_Contracts.oracle;
        admin = accounts[0];
        vault = accounts[1];
        user = accounts[1];
        bidders = [
            {
                amount: 10,
                relayAmount: 100,
                address: accounts[2]
            },
            {
                amount: 20,
                relayAmount: 50,
                address: accounts[3]
            },
            {
                amount: 20,
                relayAmount: 50,
                address: accounts[4]
            },
            {
                amount: 20,
                relayAmount: 20,
                address: accounts[5]
            },
        ];
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
        assert.equal(userStableTokenBalance, 0, 'incorrect user initial debt token balance');
        totalCredit = Number(await PegLogicContract.availableCredit.call(VaultContract.address, vault));
        amountBorrowed = (totalCredit * 0.95);
        assert.isAbove(totalCredit, amountBorrowed, 'total credit is below amount to be borrowed');
        await LogicActionsContract.borrow(VaultContract.address, amountBorrowed, {
            from: user
        });
        let newAvailableCredit = Number(await PegLogicContract.availableCredit.call(VaultContract.address, vault));
        assert.equal(newAvailableCredit, (totalCredit * 0.05), "wrong newAvailableCredit");
        userStableTokenBalance = Number(await StableTokenContract.balanceOf.call(user));
        assert.equal(userStableTokenBalance, amountBorrowed, 'debt token balance is not equal to what is borrowed');
        assert.equal(amountBorrowed, Number(await PegLogicContract.actualDebt.call(VaultContract.address, vault)), 'actual debt is not equal to what is borrowed');
        assert.equal(amountBorrowed, Number(await VaultContract.totalBorrowed.call(vault)), 'vault total borrowed is not equal to what is borrowed');
    });

    it("should issue debt tokens to bidders", async () => {
        await StableTokenContract.issue(bidders[0].address, 100 * 1e18);
        assert.equal(100, Number(await StableTokenContract.balanceOf.call(bidders[0].address)) / 1e18);
        await StableTokenContract.issue(bidders[1].address, 100 * 1e18);
        assert.equal(100, Number(await StableTokenContract.balanceOf.call(bidders[1].address)) / 1e18);
        await StableTokenContract.issue(bidders[2].address, 100 * 1e18);
        assert.equal(100, Number(await StableTokenContract.balanceOf.call(bidders[2].address)) / 1e18);
        await StableTokenContract.issue(bidders[3].address, 100 * 1e18);
        assert.equal(100, Number(await StableTokenContract.balanceOf.call(bidders[3].address)) / 1e18);
    });

    it("should throw error when vault is not yet for liquidation", async () => {
        assert.equal(await PegLogicContract.isInsolvent.call(VaultContract.address, vault), false, 'vault is for liquidation now');
        debt = Number(await PegLogicContract.actualDebt.call(VaultContract.address, vault));
        assert.isAbove(debt, 0, 'incorrect debt value');
        assert.equal(true, await VaultContract.vaultExists.call(vault), 'vault does not exist');
        try {
            await AuctionActionsContract.startAuction(VaultContract.address, vault, { from: admin });
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it("should trigger auction state when oracle price change very low", async () => {
        let val = (await OracleContract.getValue() * 0.10);
        await OracleContract.updateValue(val, {
            from: admin
        });
        await OracleContract.confirmValueUpdate({
            from: admin
        });
        oraclePrice = Number(await OracleContract.getValue.call());
        assert.equal(oraclePrice, val, "wrong oracle price");
        assert.equal(await PegLogicContract.isInsolvent.call(VaultContract.address, vault), true, 'vault is not yet for liquidation');
    });

    it("should be able to start auction of vault", async () => {
        rawBalanceOf = Number(await VaultContract.rawBalanceOf.call(vault));
        rawDebt = Number(await VaultContract.rawDebt.call(vault));
        totalBorrowed = Number(await VaultContract.totalBorrowed.call(vault));
        actualDebt = Number(await PegLogicContract.actualDebt.call(VaultContract.address, vault));
        assert.isAbove(actualDebt, 0, 'incorrect debt value');
        assert.equal(await PegLogicContract.isInsolvent.call(VaultContract.address, vault), true, 'vault is not for auction so far');

        await AuctionActionsContract.startAuction(VaultContract.address, vault, { from: admin });
        auctionAddress = await VaultContract.auctions.call(vault);
        assert(utils.zeroAddress != auctionAddress, 'vault auction address does not exist');

        assert.equal(rawBalanceOf, Number(await VaultContract.rawBalanceOf.call(auctionAddress)), 'incorrect auction contract raw balance value');
        assert.equal(rawDebt, Number(await VaultContract.rawDebt.call(auctionAddress)), 'incorrect auction contract raw debt value');
        assert.equal(totalBorrowed, Number(await VaultContract.totalBorrowed.call(auctionAddress)), 'incorrect auction contract raw debt value');
        assert.equal(actualDebt, Number(await PegLogicContract.actualDebt.call(VaultContract.address, auctionAddress)), 'incorrect auction contract debt value');
        
        assert.equal(0, Number(await VaultContract.rawBalanceOf.call(vault)), 'incorrect borrower raw balance value');
        assert.equal(0, Number(await VaultContract.rawDebt.call(vault)), 'incorrect borrower raw debt value');
        assert.equal(0, Number(await VaultContract.totalBorrowed.call(vault)), 'incorrect borrower raw debt value');
        assert.equal(0, Number(await PegLogicContract.actualDebt.call(VaultContract.address, vault)), 'incorrect borrower debt value');

        AuctionContract = await Auction.at(auctionAddress);
        assert.equal(0, Number(await AuctionContract.auctionEndTime.call()), 'incorrect auction time');
        assert.equal(0, Number(await StableTokenContract.balanceOf.call(AuctionContract.address)), 'Invalid auction contract debt token balance');

        await StableTokenContract.approve(AuctionContract.address, 1000*1e18, {from:bidders[0].address});
        await StableTokenContract.approve(AuctionContract.address, 1000*1e18, {from:bidders[1].address});
        await StableTokenContract.approve(AuctionContract.address, 1000*1e18, {from:bidders[2].address});
        await StableTokenContract.approve(AuctionContract.address, 1000*1e18, {from:bidders[3].address});
    });

    it("should throw error when bidding with collateral and relay token", async () => {
        try {
            let bidAmount = bidders[2].amount;
            let bidder = bidders[2].address;
            await StableTokenContract.approve(AuctionContract.address, actualDebt, {from:bidder});
            await AuctionContract.bid(bidAmount * 1e18, 100*1e18, {from: bidder});
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it("should place bid, enabled auction time and pay the auction debt", async () => {
        assert.equal(Number(await AuctionContract.highestBid.call())/1e18, 0, 'incorrect auction initial highest bid amount');
        let initialTotalActualDebt = Number(await PegLogicContract.totalActualDebt.call(VaultContract.address));
        let bidAmount = bidders[0].relayAmount;
        let bidder = bidders[0].address;
        lastBidder = bidders[0].address;
        let res = await AuctionContract.bid(0, bidAmount*1e18, {from: bidder});
        assert(res.logs.length > 0 && res.logs[0].event == 'HighestBidIncreased', 'incorrect event name');
        assert.equal(res.logs[0].args._bidder.toLowerCase(), bidder.toLowerCase(), 'incorrect event bidder address');
        assert.equal(Number(res.logs[0].args._amount)/1e18, 0, 'incorrect event bid amount');
        assert.equal(Number(res.logs[0].args._amountRelay)/1e18, bidAmount, 'incorrect event bid relay amount');
        assert.equal((await AuctionContract.highestBidder.call()).toLowerCase(), bidder.toLowerCase(), 'incorrect auction highest bidder address');
        assert.equal(Number(await AuctionContract.highestBid.call())/1e18, 0, 'incorrect auction highest bid amount');
        assert.equal(Number(await AuctionContract.lowestBidRelay.call())/1e18, bidAmount, 'incorrect auction lowest bid relay amount');

        let finalTotalActualDebt = Number(await PegLogicContract.totalActualDebt.call(VaultContract.address));
        assert.equal(finalTotalActualDebt, (initialTotalActualDebt - actualDebt), 'incorrect total actual debt');
        assert.isAbove(Number(await AuctionContract.auctionEndTime.call()), 0, 'incorrect auction time');
        assert.equal(Number(await StableTokenContract.balanceOf.call(AuctionContract.address)), 0, 'incorrect auction contract debt token balance');

        lastBidderDebtTokenBalance = Number(await StableTokenContract.balanceOf.call(bidder));
    });

    it("should throw error when vault is on auction and tries to borrow", async () => {
        assert.equal(await PegLogicContract.isInsolvent.call(VaultContract.address, vault), false, 'vault is not for liquidation so far');
        await contracts.CollateralTokenContract.issue(vault, 100 * 1e18);
        balance = Number(await contracts.CollateralTokenContract.balanceOf.call(vault));
        assert.equal(balance / 1e18, 100, 'Incorrect user collateral token balance');

        await contracts.CollateralTokenContract.approve(LogicActionsContract.address, 0, {from: vault});
        await contracts.CollateralTokenContract.approve(LogicActionsContract.address, 100 * 1e18, {from: vault});

        await LogicActionsContract.deposit(VaultContract.address, 100 * 1e18, {from: vault});
        balance = Number(await contracts.CollateralTokenContract.balanceOf.call(vault));
        assert.equal(balance, 0, 'Incorrect user collateral token balance after deposit');

        totalCredit = Number(await PegLogicContract.availableCredit.call(VaultContract.address, vault));
        amountBorrowed = (totalCredit * 0.95);
        assert.isAbove(totalCredit, amountBorrowed, 'total credit is below amount to be borrowed');
        assert.equal(AuctionContract.address, await VaultContract.auctions.call(vault), 'incorrect auction address');
        try {
            await LogicActionsContract.borrow(VaultContract.address, amountBorrowed, {
                from: vault
            });
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it("should outbid current lowest relay bid amount and transfer previous bid token to previous highest bidder", async () => {
        let bidAmount = bidders[1].relayAmount;
        let bidder = bidders[1].address;
        let res = await AuctionContract.bid(0, bidAmount*1e18, {from: bidder});
        assert(res.logs.length > 0 && res.logs[0].event == 'HighestBidIncreased', 'incorrect event name');
        assert.equal(res.logs[0].args._bidder.toLowerCase(), bidder.toLowerCase(), 'incorrect event bidder address');
        assert.equal(Number(res.logs[0].args._amount)/1e18, 0, 'incorrect event bid amount');
        assert.equal(Number(res.logs[0].args._amountRelay)/1e18, bidAmount, 'incorrect event relay token bid amount');
        assert.equal((await AuctionContract.highestBidder.call()).toLowerCase(), bidder.toLowerCase(), 'incorrect auction highest bidder address');
        assert.equal(Number(await AuctionContract.highestBid.call())/1e18, 0, 'incorrect auction highest bid amount');
        assert.equal(Number(await AuctionContract.lowestBidRelay.call())/1e18, bidAmount, 'incorrect auction lowest relay bid amount');
        assert.equal(Number(await StableTokenContract.balanceOf.call(lastBidder)), (lastBidderDebtTokenBalance + actualDebt), 'incorrect last bidder debt token balance');

        lastBidderDebtTokenBalance = Number(await StableTokenContract.balanceOf.call(bidder));
    });

    it("should have throw error when calling bid with high or equal amount than current lowest bid relay amount", async () => {
        try {
            let bidAmount = bidders[2].relayAmount;
            let bidder = bidders[2].address;
            await AuctionContract.bid(0, bidAmount * 1e18, {from: bidder});
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it("should outbid current highest bid and transfer previous bid token to previous highest bidder", async () => {
        let bidAmount = bidders[2].amount;
        let bidder = bidders[2].address;
        let res = await AuctionContract.bid(bidAmount*1e18, 0, {from: bidder});
        assert(res.logs.length > 0 && res.logs[0].event == 'HighestBidIncreased', 'incorrect event name');
        assert.equal(res.logs[0].args._bidder.toLowerCase(), bidder.toLowerCase(), 'incorrect event bidder address');
        assert.equal(Number(res.logs[0].args._amount)/1e18, bidAmount, 'incorrect event bid amount');
        assert.equal(Number(res.logs[0].args._amountRelay)/1e18, 0, 'incorrect event bid relay token amount');
        assert.equal((await AuctionContract.highestBidder.call()).toLowerCase(), bidder.toLowerCase(), 'incorrect auction highest bidder address');
        assert.equal(Number(await AuctionContract.highestBid.call())/1e18, bidAmount, 'incorrect auction highest bid amount');
        assert.equal(Number(await AuctionContract.lowestBidRelay.call())/1e18, 0, 'incorrect auction lowest bid relay amount');
        assert.equal(Number(await StableTokenContract.balanceOf.call(lastBidder)), (lastBidderDebtTokenBalance + actualDebt), 'incorrect last bidder debt token balance');
    });

    it("should throw error when bididng with relay token when there's already a bid of collateral amount > 0", async () => {
        try {
            let bidAmount = bidders[3].relayAmount;
            let bidder = bidders[3].address;
            await AuctionContract.bid(0, bidAmount*1e18, {from: bidder});
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
            params: [10805],
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
    
        let rawBalanceOf_borrower_before = Number(await VaultContract.rawBalanceOf.call(vault));
        let rawBalanceOf_bidder_before = Number(await VaultContract.rawBalanceOf.call(highestBidder));
        let rawBalanceOf_auction = Number(await VaultContract.rawBalanceOf.call(AuctionContract.address));
        
        await AuctionActionsContract.endAuction(VaultContract.address, vault);
    
        let rawBalanceOf_borrower_after = Number(await VaultContract.rawBalanceOf.call(vault));
        let rawBalanceOf_bidder_after = Number(await VaultContract.rawBalanceOf.call(highestBidder));
        
        assert.equal(utils.zeroAddress, await VaultContract.auctions.call(vault), 'auction address was not set to empty');
        assert.equal(rawBalanceOf_borrower_before + highestBid, rawBalanceOf_borrower_after, 'incorrect borrower raw balance value');
        assert.equal(rawBalanceOf_bidder_before + (rawBalanceOf_auction - highestBid), rawBalanceOf_bidder_after, 'incorrect bidder raw balance value');
    });

    it("should be able to borrow again", async () => {
        totalCredit = Number(await PegLogicContract.availableCredit.call(VaultContract.address, vault));
        amountBorrowed = (totalCredit * 0.95);
        assert.isAbove(totalCredit, amountBorrowed, 'total credit is below amount to be borrowed');
        await LogicActionsContract.borrow(VaultContract.address, amountBorrowed, {
            from: user
        });
        let newAvailableCredit = Number(await PegLogicContract.availableCredit.call(VaultContract.address, vault));
        assert.equal(newAvailableCredit, (totalCredit * 0.05), "wrong newAvailableCredit");
        assert.equal(amountBorrowed, Number(await PegLogicContract.actualDebt.call(VaultContract.address, vault)), 'actual debt is not equal to what is borrowed');
        assert.equal(amountBorrowed, Number(await VaultContract.totalBorrowed.call(vault)), 'vault total borrowed is not equal to what is borrowed');
    });

})