pragma solidity ^0.4.23;

import "./library/SafeMath.sol";
import "./library/ERC20Token.sol";
import "./interfaces/IContractRegistry.sol";
import "./interfaces/IPegSettings.sol";
import "./ContractIds.sol";

contract StableToken is ERC20Token, ContractIds {
    using SafeMath for uint256;

    bool public transfersEnabled = true;
    IContractRegistry public registry;

    event NewSmartToken(address _token);
    event Issuance(uint256 _amount);
    event Destruction(uint256 _amount);

    constructor(string _name, string _symbol, uint8 _decimals, IContractRegistry _registry)
        public
        ERC20Token(_name, _symbol, _decimals)
    {
        registry = _registry;
        emit NewSmartToken(address(this));
    }

    modifier transfersAllowed {
        assert(transfersEnabled);
        _;
    }

    modifier authOnly() {
        IPegSettings pegSettings = IPegSettings(registry.addressOf(ContractIds.PEG_SETTINGS));
        require(pegSettings.authorized(msg.sender));
        _;
    }

    function disableTransfers(bool _disable) public authOnly {
        transfersEnabled = !_disable;
    }

    function issue(address _to, uint256 _amount) public authOnly validAddress(_to) notThis(_to) {
        totalSupply = totalSupply.plus(_amount);
        balanceOf[_to] = balanceOf[_to].plus(_amount);

        emit Issuance(_amount);
        emit Transfer(this, _to, _amount);
    }

    function destroy(address _from, uint256 _amount) public authOnly {
        balanceOf[_from] = balanceOf[_from].minus(_amount);
        totalSupply = totalSupply.minus(_amount);
        emit Transfer(_from, this, _amount);
        emit Destruction(_amount);
    }

    function transfer(address _to, uint256 _value) public transfersAllowed returns (bool success) {
        assert(super.transfer(_to, _value));
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public transfersAllowed returns (bool success) {
        assert(super.transferFrom(_from, _to, _value));
        return true;
    }

    function transferERC20Token(IERC20Token _token, address _to, uint256 _amount) validAddress(_to) public {
        IPegSettings pegSettings = IPegSettings(registry.addressOf(ContractIds.PEG_SETTINGS));
        require(pegSettings.authorized(msg.sender));
        _token.transfer(_to, _amount);
    }
}