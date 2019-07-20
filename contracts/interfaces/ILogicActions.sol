pragma solidity ^0.4.23;

import "./IVault.sol";

contract ILogicActions {

    function deposit(IVault _vault, uint256 _amount) public;
    function withdraw(IVault _vault, address _to, uint256 _amount) public;
    function borrow(IVault _vault, uint256 _amount) public;
    function repay(IVault _vault, address _borrower, uint256 _amount) public;
    function repayAuction(IVault _vault, address _borrower, uint256 _amount) public;
    function repayAll(IVault _vault, address _borrower) public;

}