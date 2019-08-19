pragma solidity ^0.4.23;
import "./ISmartToken.sol";

contract IBancorConverter {
    function token() public view returns (ISmartToken) {}
}