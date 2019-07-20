pragma solidity ^0.4.23;

import "./IVault.sol";
import "./IERC20Token.sol";
import "./IStableToken.sol";

contract IPegLogic {

    function adjustCollateralBorrowingRate() public;
    function isInsolvent(IVault _vault, address _borrower) public view returns (bool);
    function actualDebt(IVault _vault, address _address) public view returns(uint256);
    function excessCollateral(IVault _vault, address _borrower) public view returns (int256);
    function availableCredit(IVault _vault, address _borrower) public view returns (int256);
    function getCollateralToken(IVault _vault) public view returns(IERC20Token);
    function getDebtToken(IVault _vault) public view returns(IStableToken);

}