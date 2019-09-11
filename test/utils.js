const SmartToken = artifacts.require("SmartToken");
const ContractRegistry = artifacts.require("ContractRegistry");
const ContractIds = artifacts.require("ContractIds");
const Vault = artifacts.require("Vault");
const PegLogic = artifacts.require("PegLogic");
const LogicActions = artifacts.require("LogicActions");
const AuctionActions = artifacts.require("AuctionActions");
const PegSettings = artifacts.require("PegSettings");
const Oracle = artifacts.require("Oracle");
const BancorConverter = artifacts.require("BancorConverter");
const MultiSigWallet = artifacts.require("MultiSigWallet");

const isException = error => {
    let strError = error.toString();
    return strError.includes("VM Exception") || strError.includes("invalid opcode") || strError.includes("invalid JUMP");
}

const ensureException = error => {
    assert(isException(error), error.toString());
}

const createContracts = async accounts => {
    const owners =  accounts.slice(4, 6);

    const RegistryContract = await ContractRegistry.new();
    const InstanceRegistryContract = await ContractRegistry.new();

    const ContractIdsContract = await ContractIds.new();
    const CollateralTokenContract = await SmartToken.new("Bancor Network Token", "BNT", 18, InstanceRegistryContract.address);
    const PEGUSDTokenContract = await SmartToken.new("PEG Token", "PEG:USD", 18, InstanceRegistryContract.address);
    await RegistryContract.registerAddress(await ContractIdsContract.COLLATERAL_TOKEN.call(), CollateralTokenContract.address);
    await RegistryContract.registerAddress(await ContractIdsContract.PEGUSD_TOKEN.call(), PEGUSDTokenContract.address);
    
    // USDB Instance
    const StableTokenContract = await SmartToken.new("Bancor USD", "USDB", 18, InstanceRegistryContract.address);
    const VaultAContract = await Vault.new(InstanceRegistryContract.address);
    const VaultBContract = await Vault.new(InstanceRegistryContract.address);
    const PegLogicContract = await PegLogic.new(InstanceRegistryContract.address);
    const LogicActionsContract = await LogicActions.new(InstanceRegistryContract.address);
    const AuctionActionsContract = await AuctionActions.new(InstanceRegistryContract.address);
    const OracleContract = await Oracle.new();

    await InstanceRegistryContract.registerAddress(await ContractIdsContract.COLLATERAL_TOKEN.call(), CollateralTokenContract.address);
    await InstanceRegistryContract.registerAddress(await ContractIdsContract.PEGUSD_TOKEN.call(), PEGUSDTokenContract.address);
    await InstanceRegistryContract.registerAddress(await ContractIdsContract.VAULT_A.call(), VaultAContract.address);
    await InstanceRegistryContract.registerAddress(await ContractIdsContract.VAULT_B.call(), VaultBContract.address);
    await InstanceRegistryContract.registerAddress(await ContractIdsContract.ORACLE.call(), OracleContract.address);
    await InstanceRegistryContract.registerAddress(await ContractIdsContract.STABLE_TOKEN.call(), StableTokenContract.address);
    await InstanceRegistryContract.registerAddress(await ContractIdsContract.PEG_LOGIC.call(), PegLogicContract.address);
    await InstanceRegistryContract.registerAddress(await ContractIdsContract.PEG_LOGIC_ACTIONS.call(), LogicActionsContract.address);
    await InstanceRegistryContract.registerAddress(await ContractIdsContract.AUCTION_ACTIONS.call(), AuctionActionsContract.address);

    // RELAY TOKEN
    const RelayTokenContract = await SmartToken.new("PEGUSD:USDB Relay Token", "PEGUSD:USDB", 18, InstanceRegistryContract.address);
    const ConverterContract = await BancorConverter.new(RelayTokenContract.address);
    await InstanceRegistryContract.registerAddress(await ContractIdsContract.FEE_RECIPIENT.call(), ConverterContract.address);
    
    const defaultAddresses = [
        PegLogicContract.address, 
        LogicActionsContract.address, 
        AuctionActionsContract.address, 
        VaultAContract.address, 
        VaultBContract.address,
        ConverterContract.address
    ];
    const MultiSigWalletContract = await MultiSigWallet.new(owners, owners.length);
    const PegSettingsContract = await PegSettings.new(defaultAddresses);
    await PegSettingsContract.setOwner(MultiSigWalletContract.address);
    await InstanceRegistryContract.registerAddress(await ContractIdsContract.PEG_SETTINGS.call(), PegSettingsContract.address);

    return {
        Owners: owners,
        DefaultAuthorization: defaultAddresses,
        RegistryContract: RegistryContract,
        ContractIdsContract: ContractIdsContract,
        CollateralTokenContract: CollateralTokenContract,
        PEGUSDTokenContract: PEGUSDTokenContract,
        RelayTokenContract: RelayTokenContract,
        ConverterContract: ConverterContract,
        MultiSigWalletContract: MultiSigWalletContract,
        USDB_Contracts: {
            vaultA: VaultAContract,
            vaultB: VaultBContract,
            oracle: OracleContract,
            pegLogic: PegLogicContract,
            logicActions: LogicActionsContract,
            auctionActions: AuctionActionsContract,
            pegSettings: PegSettingsContract,
            stableToken: StableTokenContract
        },
        USDB_InstanceRegistryContract: InstanceRegistryContract
    }

};

module.exports = {
    contracts: createContracts,
    zeroAddress: "0x0000000000000000000000000000000000000000",
    isException: isException,
    ensureException: ensureException
};
