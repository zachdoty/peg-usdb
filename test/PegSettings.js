const utils = require('./utils');

contract("PegSettings test", (accounts) => {

    before(async () => {
        contracts = await utils.contracts(accounts);
        PegSettings = contracts.BUSD_Contracts.pegSettings;
        MultiSigWallet = contracts.MultiSigWalletContract;
    });

    it("should have correct owners", async() => {
        for(let i = 0; i < contracts.Owners.length; i++) {
            assert.equal(true, await MultiSigWallet.isOwner.call(contracts.Owners[i]), "Incorrect owner");
        }
    });

    it("should have authorized default addresses", async() => {
        for(let i = 0; i < contracts.DefaultAuthorization.length; i++) {
            assert.equal(true, await PegSettings.authorized.call(contracts.DefaultAuthorization[i]), "Not authorized");
        }
    });

    it("should throw error when sender is not one of the owner", async () => {
        try {
            const data = PegSettings.contract.authorize.getData(accounts[9], true);
            await MultiSigWallet.submitTransaction(PegSettings.address, 0, data, { from: accounts[9] });
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it("should throw error when sender has already confirmed on an address authorization action", async () => {
        assert.equal(false, await PegSettings.authorized.call(accounts[8]), "Authorized");
        const data = PegSettings.contract.authorize.getData(accounts[8], true);
        await MultiSigWallet.submitTransaction(PegSettings.address, 0, data, { from: contracts.Owners[0] });
        const txCount = await MultiSigWallet.transactionCount.call();
        try {
            await MultiSigWallet.confirmTransaction((txCount - 1), { from: contracts.Owners[0] });
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it("should authorization an address", async () => {
        assert.equal(false, await PegSettings.authorized.call(accounts[8]), "Authorized");
        const data = PegSettings.contract.authorize.getData(accounts[8], true);
        await MultiSigWallet.submitTransaction(PegSettings.address, 0, data, { from: contracts.Owners[0] });
        const txCount = await MultiSigWallet.transactionCount.call();
        await MultiSigWallet.confirmTransaction((txCount - 1), { from: contracts.Owners[1] });
        assert.equal(true, await PegSettings.authorized.call(accounts[8]), "Unauthorized");
    });

    it("should throw error when sender has already confirmed on an address unauthorization action", async () => {
        assert.equal(true, await PegSettings.authorized.call(accounts[8]), "Unauthorized");
        const data = PegSettings.contract.authorize.getData(accounts[8], false);
        await MultiSigWallet.submitTransaction(PegSettings.address, 0, data, { from: contracts.Owners[0] });
        const txCount = await MultiSigWallet.transactionCount.call();
        try {
            await MultiSigWallet.confirmTransaction((txCount - 1), { from: contracts.Owners[0] });
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it("should unauthorization an address", async () => {
        assert.equal(true, await PegSettings.authorized.call(accounts[8]), "Unauthorized");
        const data = PegSettings.contract.authorize.getData(accounts[8], false);
        await MultiSigWallet.submitTransaction(PegSettings.address, 0, data, { from: contracts.Owners[0] });
        const txCount = await MultiSigWallet.transactionCount.call();
        await MultiSigWallet.confirmTransaction((txCount - 1), { from: contracts.Owners[1] });
        assert.equal(false, await PegSettings.authorized.call(accounts[8]), "Authorized");
    });

})