pragma solidity ^0.4.23;

import "./IVault.sol";

contract IAuctionActions {

    function startAuction(IVault _vault, address _borrower) public;
    function endAuction(IVault _vault, address _borrower) public;

}