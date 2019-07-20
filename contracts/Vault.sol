pragma solidity ^0.4.23;

import "./interfaces/IVault.sol";
import "./interfaces/IERC20Token.sol";
import "./interfaces/IPegSettings.sol";
import "./interfaces/IPegOracle.sol";
import "./interfaces/IContractRegistry.sol";
import "./library/SafeMath.sol";
import "./Helpers.sol";
import "./Auction.sol";

contract Vault is Helpers {
    using SafeMath for uint256;
    using SafeMath for int256;

    IContractRegistry public registry;

    address[] public vaults;
    mapping (address => address) public auctions;
    mapping (address => bool) public vaultExists;
    mapping (address => uint256) public totalBorrowed;
    mapping (address => uint256) public rawBalanceOf;
    mapping (address => uint256) public rawDebt;
    uint256 public rawTotalBalance;
    uint256 public rawTotalDebt;
    uint256 public collateralBorrowedRatio;
    uint256 public amountMinted;

    uint256 public debtScalePrevious = 1e18;
    uint256 public debtScaleTimestamp = now;
    int256 public debtScaleRate;

    uint256 public balScalePrevious = 1e18;
    uint256 public balScaleTimestamp = now;
    int256 public balScaleRate;

    uint32 public liquidationRatio = 850000;
    uint32 public maxBorrowLTV = 500000;

    bool public borrowingEnabled = true;

    uint public biddingTime = 10800; // 3 hours

    event AmountMinted(uint256 _old, uint256 _new);
    event Create(address indexed _borrower);
    event DebtScalingRateUpdate(int _old, int _new);
    event BalanceScalingRateUpdate(int _old, int _new);
    event CollateralBorrowedRatio(uint _old, uint _new);
    event LiquidationRatioUpdate(int _old, int _new);
    event MaxBorrowUpdate(uint32 _old, uint32 _new);
    event Deposit(address indexed _borrower, uint256 _amount);
    event Liquidate(address indexed _borrower);
    event Borrow(address indexed _borrower, uint256 _amount);
    event Repay(address indexed _borrower, uint256 _amount);
    event Withdraw(address indexed _borrower, address indexed _to, uint256 _amount);
    event AuctionStarted(address indexed _borrower);
    event AuctionEnded(address indexed _borrower, address indexed _highestBidder, uint256 _highestBid);
   
    constructor(IContractRegistry _registry) public Helpers(_registry) {
        registry = _registry;
    }

    function setBorrowingEnabled(bool _enabled) public authOnly {
        borrowingEnabled = _enabled;
    }

    function create(address _borrower) public authOnly {
        if(vaultExists[_borrower] == false) {
            vaults.push(_borrower);
            vaultExists[_borrower] = true;
            emit Create(_borrower);
        }
    }

    function setCollateralBorrowedRatio(uint _newRatio) public authOnly {
        emit CollateralBorrowedRatio(collateralBorrowedRatio, _newRatio);
        collateralBorrowedRatio = _newRatio;
    }

    function setAmountMinted(uint _amountMinted) public authOnly {
        emit AmountMinted(amountMinted, _amountMinted);
        amountMinted = _amountMinted;
    }

    function setLiquidationRatio(uint32 _liquidationRatio) public authOnly {
        emit LiquidationRatioUpdate(liquidationRatio, _liquidationRatio);
        liquidationRatio = _liquidationRatio;
    }

    function setMaxBorrowLTV(uint32 _maxBorrowLTV) public authOnly {
        emit MaxBorrowUpdate(maxBorrowLTV, _maxBorrowLTV);
        maxBorrowLTV = _maxBorrowLTV;
    }

    function setDebtScalingRate(int256 _debtScalingRate) public authOnly {
        emit DebtScalingRateUpdate(debtScaleRate, _debtScalingRate);
        debtScalePrevious = debtScalingFactor();
        debtScaleTimestamp = now;
        debtScaleRate = _debtScalingRate;
    }

    function setBalanceScalingRate(int256 _balanceScalingRate) public authOnly {
        emit BalanceScalingRateUpdate(balScaleRate, _balanceScalingRate);
        balScalePrevious = balanceScalingFactor();
        balScaleTimestamp = now;
        balScaleRate = _balanceScalingRate;
    }

    function setBiddingTime(uint _biddingTime) public authOnly {
        biddingTime = _biddingTime;
    }

    function setRawTotalBalance(uint _rawTotalBalance) public authOnly {
        rawTotalBalance = _rawTotalBalance;
    }

    function setRawTotalDebt(uint _rawTotalDebt) public authOnly {
        rawTotalDebt = _rawTotalDebt;
    }

    function setRawBalanceOf(address _borrower, uint _rawBalance) public authOnly {
        rawBalanceOf[_borrower] = _rawBalance;
    }

    function setRawDebt(address _borrower, uint _rawDebt) public authOnly {
        rawDebt[_borrower] = _rawDebt;
    }

    function setTotalBorrowed(address _borrower, uint _totalBorrowed) public authOnly {
        totalBorrowed[_borrower] = _totalBorrowed;
    }

    function debtScalingFactor() public view returns (uint) {
        return uint(int(debtScalePrevious).plus(debtScaleRate.times(int(now.minus(debtScaleTimestamp)))));
    }

    function balanceScalingFactor() public view returns (uint) {
        return uint(int(balScalePrevious).plus(balScaleRate.times(int(now.minus(balScaleTimestamp)))));
    }

    function debtRawToActual(uint256 _raw) public view returns(uint256) {
        return _raw.times(1e18) / debtScalingFactor();
    }

    function debtActualToRaw(uint256 _actual) public view returns(uint256) {
        return _actual.times(debtScalingFactor()) / 1e18;
    }

    function balanceRawToActual(uint256 _raw) public view returns(uint256) {
        return _raw.times(1e18) / balanceScalingFactor();
    }

    function balanceActualToRaw(uint256 _actual) public view returns(uint256) {
        return _actual.times(balanceScalingFactor()) / 1e18;
    }

    function getVaults() public view returns (address[]) {
        return vaults;
    }

    function transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public authOnly {
        _token.transfer(_to, _amount);
    }

    function oracleValue() public view returns(uint) {
        if (address(this) == address(vaultA())) {
            return oracle().getValue();
        } else {
            return 1e12 / oracle().getValue();
        }
    }

    function emitRepay(address _borrower, uint256 _amount) public authOnly {
        emit Repay(_borrower, _amount);
    }

    function emitDeposit(address _borrower, uint256 _amount) public authOnly {
        emit Deposit(_borrower, _amount);
    }

    function emitWithdraw(address _borrower, address _to, uint256 _amount) public authOnly {
        emit Withdraw(_borrower, _to, _amount);
    }

    function emitBorrow(address _borrower, uint256 _amount) public authOnly {
        emit Borrow(_borrower, _amount);
    }

    function emitLiquidate(address _borrower) public authOnly {
        emit Liquidate(_borrower);
    }

    function emitAuctionStarted(address _borrower) public authOnly {
        emit AuctionStarted(_borrower);
    }

    function emitAuctionEnded(address _borrower, address _highestBidder, uint256 _highestBid) public authOnly {
        emit AuctionEnded(_borrower, _highestBidder, _highestBid);
    }
    
    function setAuctionAddress(address _borrower, address _auction) public authOnly {
        auctions[_borrower] = _auction;
    }

}