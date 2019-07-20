pragma solidity ^0.4.23;

import "./IERC20Token.sol";
import "./IContractRegistry.sol";

contract IVault {

    function registry() public view returns (IContractRegistry);

    function auctions(address _borrower) public view returns (address) { _borrower; }
    function vaultExists(address _vault) public view returns (bool) { _vault; }
    function totalBorrowed(address _vault) public view returns (uint256) { _vault; }
    function rawBalanceOf(address _vault) public view returns (uint256) { _vault; }
    function rawDebt(address _vault) public view returns (uint256) { _vault; }
    function rawTotalBalance() public view returns (uint256);
    function rawTotalDebt() public view returns (uint256);
    function collateralBorrowedRatio() public view returns (uint256);
    function amountMinted() public view returns (uint256);

    function debtScalePrevious() public view returns (uint256);
    function debtScaleTimestamp() public view returns (uint256);
    function debtScaleRate() public view returns (int256);
    function balScalePrevious() public view returns (uint256);
    function balScaleTimestamp() public view returns (uint256);
    function balScaleRate() public view returns (int256);
    
    function liquidationRatio() public view returns (uint32);
    function maxBorrowLTV() public view returns (uint32);

    function borrowingEnabled() public view returns (bool);
    function biddingTime() public view returns (uint);

    function setType(bool _type) public;
    function create(address _vault) public;
    function setCollateralBorrowedRatio(uint _newRatio) public;
    function setAmountMinted(uint _amountMinted) public;
    function setLiquidationRatio(uint32 _liquidationRatio) public;
    function setMaxBorrowLTV(uint32 _maxBorrowLTV) public;
    function setDebtScalingRate(int256 _debtScalingRate) public;
    function setBalanceScalingRate(int256 _balanceScalingRate) public;
    function setBiddingTime(uint _biddingTime) public;
    function setRawTotalDebt(uint _rawTotalDebt) public;
    function setRawTotalBalance(uint _rawTotalBalance) public;
    function setRawBalanceOf(address _borrower, uint _rawBalance) public;
    function setRawDebt(address _borrower, uint _rawDebt) public;
    function setTotalBorrowed(address _borrower, uint _totalBorrowed) public;
    function debtScalingFactor() public view returns (uint256);
    function balanceScalingFactor() public view returns (uint256);
    function debtRawToActual(uint256 _raw) public view returns (uint256);
    function debtActualToRaw(uint256 _actual) public view returns (uint256);
    function balanceRawToActual(uint256 _raw) public view returns (uint256);
    function balanceActualToRaw(uint256 _actual) public view returns (uint256);
    function getVaults(address _vault, uint256 _balanceOf) public view returns(address[]);
    function transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public;
    function oracleValue() public view returns(uint256);
    function emitBorrow(address _borrower, uint256 _amount) public;
    function emitRepay(address _borrower, uint256 _amount) public;
    function emitDeposit(address _borrower, uint256 _amount) public;
    function emitWithdraw(address _borrower, address _to, uint256 _amount) public;
    function emitLiquidate(address _borrower) public;
    function emitAuctionStarted(address _borrower) public;
    function emitAuctionEnded(address _borrower, address _highestBidder, uint256 _highestBid) public;
    function setAuctionAddress(address _borrower, address _auction) public;
}