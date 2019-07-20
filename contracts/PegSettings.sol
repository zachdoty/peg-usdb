pragma solidity ^0.4.23;

import "./interfaces/IPegOracle.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IStableToken.sol";
import "./interfaces/ISmartToken.sol";
import "./interfaces/IContractRegistry.sol";
import "./library/SafeMath.sol";
import "./ContractIds.sol";

contract PegSettings is ContractIds {

    using SafeMath for uint256;
    using SafeMath for int256;

    IContractRegistry public registry;

    mapping (address => bool) public authorized;

    event Authorize(address _address, bool _auth);

    constructor(IContractRegistry _registry) public {
        authorized[msg.sender] = true;
        registry = _registry;
    }

    modifier authOnly() {
        require(authorized[msg.sender] == true);
        _;
    }

    function authorize(address _address, bool _auth) public authOnly {
        emit Authorize(_address, _auth);
        authorized[_address] = _auth;
    }

    function transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public authOnly {
        _token.transfer(_to, _amount);
    }
}