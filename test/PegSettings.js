const utils = require('./utils');

contract("PegSettings test", (accounts) => {

    before(async () => {
        contracts = await utils.contracts(accounts);
        PegSettings = contracts.BUSD_Contracts.pegSettings;
    });

    it("should have correct signers", async() => {
        for(let i = 0; i < contracts.Signers.length; i++) {
            assert.equal(true, await PegSettings.isSigner.call(contracts.Signers[i]), "Incorrect signer");
        }
    });

    it("should have authorized default addresses", async() => {
        for(let i = 0; i < contracts.DefaultAuthorization.length; i++) {
            assert.equal(true, await PegSettings.authorized.call(contracts.DefaultAuthorization[i]), "Not authorized");
        }
    });

    it("should throw error when sender is not one of the signers", async () => {
        try {
            await PegSettings.authorize(accounts[9], true, { from: accounts[9] });
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it("should throw error when sender has already voted on an address authorization action", async () => {
        assert.equal(false, await PegSettings.authorized.call(accounts[8]), "Authorized");
        try {
            await PegSettings.authorize(accounts[8], true, { from: contracts.Signers[0] });
            await PegSettings.authorize(accounts[8], true, { from: contracts.Signers[0] });
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it("should throw error when sender has already voted on an address unauthorization action", async () => {
        assert.equal(false, await PegSettings.authorized.call(accounts[7]), "Authorized");
        await PegSettings.authorize(accounts[7], true, { from: contracts.Signers[0] });
        await PegSettings.authorize(accounts[7], true, { from: contracts.Signers[1] });
        assert.equal(true, await PegSettings.authorized.call(accounts[7]), "Not Authorized");
        try {
            await PegSettings.authorize(accounts[7], true, { from: contracts.Signers[0] });
            await PegSettings.authorize(accounts[7], true, { from: contracts.Signers[0] });
            assert(false, "didn't throw");
        } catch (error) {
            return utils.ensureException(error);
        }
    });

    it("should authorized an address", async() => {
        assert.equal(false, await PegSettings.authorized.call(accounts[9]), "Authorized");
        await PegSettings.authorize(accounts[9], true, { from: contracts.Signers[0] });
        await PegSettings.authorize(accounts[9], true, { from: contracts.Signers[1] });
        assert.equal(true, await PegSettings.authorized.call(accounts[9]), "Not Authorized");
    });

    it("should unauthorized an address", async() => {
        assert.equal(true, await PegSettings.authorized.call(accounts[9]), "Not Authorized");
        await PegSettings.authorize(accounts[9], false, { from: contracts.Signers[0] });
        await PegSettings.authorize(accounts[9], false, { from: contracts.Signers[1] });
        assert.equal(false, await PegSettings.authorized.call(accounts[9]), "Authorized");
    });

})