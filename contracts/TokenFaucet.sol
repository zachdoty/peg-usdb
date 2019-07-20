pragma solidity ^0.4.23;

import "./interfaces/IERC20Token.sol";

contract TokenFaucet {
    function faucet(IERC20Token _token) public {
        _token.transfer(msg.sender, 100 * 1e18);
    }
}