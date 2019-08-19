pragma solidity ^0.4.23;

import "./Helpers.sol";
import "./library/SafeMath.sol";
import "./interfaces/IPegLogic.sol";
import "./interfaces/IVault.sol";
import "./interfaces/IERC20Token.sol";

contract LogicActions is Helpers {

    using SafeMath for uint256;
    using SafeMath for int256;

    IContractRegistry public registry;

    constructor(IContractRegistry _registry) public Helpers(_registry) {
        registry = _registry;
    }

    function deposit(IVault _vault, uint256 _amount) public validate(_vault, msg.sender) {
        IERC20Token vaultCollateralToken = pegLogic().getCollateralToken(_vault);
        vaultCollateralToken.transferFrom(msg.sender, address(_vault), _amount);
        _vault.setRawBalanceOf(
            msg.sender,
            _vault.rawBalanceOf(msg.sender).plus(_vault.balanceActualToRaw(_amount))
        );
        _vault.setRawTotalBalance(
            _vault.rawTotalBalance().plus(_vault.balanceActualToRaw(_amount))
        );
        pegLogic().adjustCollateralBorrowingRate();
        _vault.emitDeposit(msg.sender, _amount);
    }

    function withdraw(IVault _vault, address _to, uint256 _amount) public validate(_vault, msg.sender) {
        IPegLogic ipegLogic = pegLogic();
        require(_amount.toInt256() <= ipegLogic.excessCollateral(_vault, msg.sender), "Insufficient collateral balance");
        _vault.setRawBalanceOf(
            msg.sender,
            _vault.rawBalanceOf(msg.sender).minus(_vault.balanceActualToRaw(_amount))
        );
        _vault.setRawTotalBalance(
            _vault.rawTotalBalance().minus(_vault.balanceActualToRaw(_amount))
        );
        _vault.transferERC20Token(ipegLogic.getCollateralToken(_vault), _to, _amount);
        ipegLogic.adjustCollateralBorrowingRate();
        _vault.emitWithdraw(msg.sender, _to, _amount);
    }

    function borrow(IVault _vault, uint256 _amount) public validate(_vault, msg.sender) {
        IPegLogic ipegLogic = pegLogic();
        require(_amount.toInt256() <= ipegLogic.availableCredit(_vault, msg.sender), "Not enough available credit");
        require(_vault.borrowingEnabled(), "Borrowing disabled");
        address auctionAddress = _vault.auctions(msg.sender);
        require(auctionAddress == address(0), "Can't borrow when there's ongoing auction on your vault");
        _vault.setRawDebt(msg.sender, _vault.rawDebt(msg.sender).plus(_vault.debtActualToRaw(_amount)));
        _vault.setTotalBorrowed(msg.sender, _vault.totalBorrowed(msg.sender).plus(_amount));
        _vault.setRawTotalDebt(_vault.rawTotalDebt().plus(_vault.debtActualToRaw(_amount)));
        if (address(_vault) == address(vaultA())) {
            stableToken().issue(msg.sender, _amount);
        } else {
            vaultA().transferERC20Token(collateralToken(), msg.sender, _amount);
        }
        ipegLogic.adjustCollateralBorrowingRate();
        _vault.emitBorrow(msg.sender, _amount);
    }

    function doPay(IVault _vault, address _payor, address _borrower, uint256 _amount, bool _all) internal {
        IStableToken vaultDebtToken = pegLogic().getDebtToken(_vault);
        if (address(_vault) == address(vaultA())) {
            vaultDebtToken.destroy(_payor, _amount);
        } else {
            vaultDebtToken.transferFrom(_payor, address(vaultA()), _amount);
        }
        _vault.setRawTotalDebt(_vault.rawTotalDebt().minus(_vault.debtActualToRaw(_amount)));

        if(_all) {
            _vault.setRawDebt(_borrower, 0);
            _vault.setTotalBorrowed(_borrower, 0);
        } else {
            _vault.setRawDebt(_borrower, _vault.rawDebt(_borrower).minus(_vault.debtActualToRaw(_amount)));
            _vault.setTotalBorrowed(_borrower, _vault.totalBorrowed(_borrower).minus(_amount));
        }
        pegLogic().adjustCollateralBorrowingRate();
        _vault.emitRepay(_borrower, _amount);
    }

    function repay(IVault _vault, address _borrower, uint256 _amount) public validate(_vault, _borrower) {
        doPay(_vault, msg.sender, _borrower, _amount, false);
    }

    function repayAuction(IVault _vault, address _borrower, uint256 _amount) public validate(_vault, _borrower)
    {
        require(_vault.auctions(_borrower) == msg.sender, "Invalid auction");
        doPay(_vault, msg.sender, msg.sender, _amount, true);
    }

    function repayAll(IVault _vault, address _borrower) public validate(_vault, _borrower) {
        uint256 _amount = pegLogic().actualDebt(_vault, _borrower);
        doPay(_vault, msg.sender, _borrower, _amount, true);
    }

}