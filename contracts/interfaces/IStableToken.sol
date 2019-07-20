pragma solidity ^0.4.23;
import "./ISmartToken.sol";
import "./IERC20Token.sol";

contract IStableToken is ISmartToken {
    
    function transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public;

}
