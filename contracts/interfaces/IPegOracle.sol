pragma solidity ^0.4.23;

contract IPegOracle {
    function getValue() public view returns (uint256);
}
