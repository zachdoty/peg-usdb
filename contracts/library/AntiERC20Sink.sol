pragma solidity ^0.4.23;
import "../interfaces/IERC20Token.sol";

contract AntiERC20Sink {
    address public deployer;
    constructor() public { deployer = msg.sender; }
    function transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public {
        require(msg.sender == deployer);
        _token.transfer(_to, _amount);
    }
}
