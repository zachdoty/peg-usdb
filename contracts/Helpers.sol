pragma solidity ^0.4.23;

import "./interfaces/IContractRegistry.sol";
import "./interfaces/IPegSettings.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IPegOracle.sol";
import "./interfaces/IERC20Token.sol";
import "./interfaces/ISmartToken.sol";
import "./interfaces/IPegLogic.sol";
import "./interfaces/IAuctionActions.sol";
import "./ContractIds.sol";

contract Helpers is ContractIds {

    IContractRegistry public registry;

    constructor(IContractRegistry _registry) public {
        registry = _registry;
    }

    modifier authOnly() {
        require(settings().authorized(msg.sender));
        _;
    }

    modifier validate(IVault _vault, address _borrower) {
        require(address(_vault) == registry.addressOf(ContractIds.VAULT_A) || address(_vault) == registry.addressOf(ContractIds.VAULT_B));
        _vault.create(_borrower);
        _;
    }

    function stableToken() internal returns(ISmartToken) {
        return ISmartToken(registry.addressOf(ContractIds.STABLE_TOKEN));
    }

    function collateralToken() internal returns(ISmartToken) {
        return ISmartToken(registry.addressOf(ContractIds.COLLATERAL_TOKEN));
    }

    function PEGUSD() internal returns(IERC20Token) {
        return IERC20Token(registry.addressOf(ContractIds.PEGUSD_TOKEN));
    }

    function vaultA() internal returns(IVault) {
        return IVault(registry.addressOf(ContractIds.VAULT_A));
    }

    function vaultB() internal returns(IVault) {
        return IVault(registry.addressOf(ContractIds.VAULT_B));
    }

    function oracle() internal returns(IPegOracle) {
        return IPegOracle(registry.addressOf(ContractIds.ORACLE));
    }

    function settings() internal returns(IPegSettings) {
        return IPegSettings(registry.addressOf(ContractIds.PEG_SETTINGS));
    }

    function pegLogic() internal returns(IPegLogic) {
        return IPegLogic(registry.addressOf(ContractIds.PEG_LOGIC));
    }

    function auctionActions() internal returns(IAuctionActions) {
        return IAuctionActions(registry.addressOf(ContractIds.AUCTION_ACTIONS));
    }

    function transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public authOnly {
        _token.transfer(_to, _amount);
    }

}