pragma solidity ^0.4.23;
import "../interfaces/ISmartToken.sol";

contract BancorConverter {
    ISmartToken public token; 
    constructor(
        ISmartToken _token
    ) {
        token = _token;
    }
}