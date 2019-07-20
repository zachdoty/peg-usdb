pragma solidity ^0.4.23;

import "./interfaces/IPegOracle.sol";
import "./interfaces/IERC20Token.sol";
import "./library/Owned.sol";

contract Oracle is IPegOracle, Owned {

    uint256 public value = 1000000;
    uint256 public newValue = 1000000;

    constructor() public {}

    function updateValue(uint256 _newValue) public ownerOnly {
        newValue = _newValue;
    }

    function confirmValueUpdate() public ownerOnly {
        value = newValue;
    }

    function getValue() public view returns (uint256) {
        return value;
    }

    function transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public ownerOnly {
        _token.transfer(_to, _amount);
    }
}