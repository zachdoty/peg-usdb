pragma solidity ^0.4.23;

import "./Helpers.sol";
import "./ContractIds.sol";
import "./library/SafeMath.sol";
import "./interfaces/IContractRegistry.sol";
import "./interfaces/IVault.sol";

contract PegLogic is Helpers {

    using SafeMath for uint256;
    using SafeMath for int256;

    IContractRegistry public registry;

    constructor(IContractRegistry _registry) public Helpers(_registry) {
        registry = _registry;
    }

    function collateralValue(IVault _vault, address _borrower) public view validate(_vault, _borrower) returns(uint) {
        return actualBalance(_vault, _borrower).times(_vault.oracleValue()) / 1e6;
    }

    function liquidationPrice(IVault _vault, address _borrower) public view validate(_vault, _borrower) returns(uint) {
        return actualBalance(_vault, _borrower).times(_vault.liquidationRatio()) / 1e6;
    }

    function totalCredit(IVault _vault, address _borrower) public view validate(_vault, _borrower) returns (int256) {
        return (collateralValue(_vault, _borrower).times(_vault.maxBorrowLTV()) / 1e6).toInt256();
    }

    function availableCredit(IVault _vault, address _borrower) public view returns (int256) {
        return totalCredit(_vault, _borrower).minus(actualDebt(_vault, _borrower).toInt256());
    }

    function minSafeBalance(IVault _vault, address _borrower) public view validate(_vault, _borrower) returns (uint256) {
        return actualDebt(_vault, _borrower).times(1e12) / _vault.oracleValue() / _vault.maxBorrowLTV();
    }

    function minBalance(IVault _vault, address _borrower) public view validate(_vault, _borrower) returns (uint256) {
        return actualDebt(_vault, _borrower).times(1e12) / _vault.oracleValue() / _vault.liquidationRatio();
    }

    function excessCollateral(IVault _vault, address _borrower) public view returns (int256) {
        return int(actualBalance(_vault, _borrower)).minus(int(minSafeBalance(_vault, _borrower)));
    }

    function isInsolvent(IVault _vault, address _borrower) public view returns (bool) {
        return (actualDebt(_vault, _borrower) > 0 && actualBalance(_vault, _borrower) < minBalance(_vault, _borrower));
    }

    function totalActualDebt(IVault _vault) public view returns(uint) {
        return _vault.debtRawToActual(_vault.rawTotalDebt());
    }

    function mintableAmount(IVault _vault) public view returns(uint) {
        return totalActualDebt(_vault).minus(stableToken().totalSupply());
    }

    function ratioVaultABorrowed() public view returns(uint256) {
        return vaultB().debtRawToActual(vaultB().rawTotalDebt()).times(1e18) / actualTotalBalance(vaultA());
    }

    function actualTotalBalance(IVault _vault) public view returns(uint256) {
        return _vault.balanceRawToActual(_vault.rawTotalBalance());
    }

    function actualDebt(IVault _vault, address _address) public view returns(uint256) {
        return _vault.debtRawToActual(_vault.rawDebt(_address));
    }

    function actualBalance(IVault _vault, address _address) public view returns(uint256) {
        return _vault.balanceRawToActual(_vault.rawBalanceOf(_address));
    }

    function adjustDebtStabilityFee(IVault _vault, bool _increaseStabilityFee) public authOnly {
        if(_increaseStabilityFee) {
            _vault.setDebtScalingRate(_vault.debtScaleRate().minus(1e8));
        }else{
            _vault.setDebtScalingRate(_vault.debtScaleRate().plus(1e8));
        }
    }

    function adjustCollateralBorrowingRate() public authOnly {
        int secondsInYear = 31540000;
        int ratio = int(ratioVaultABorrowed());
        int newRate = (ratio * 2 - 15e17) * -100 / secondsInYear;
        if(ratio < 8e17) {
            newRate = ratio * 100 / (secondsInYear * -8);
        }
        if(vaultB().rawTotalDebt() > 0)
            setCollateralBorrowingRate(newRate);
    }

    function processStabilityFee(IVault _vault) public {
        mintStabletoken(registry.addressOf(ContractIds.FEE_RECIPIENT), mintableAmount(_vault));
    }

    function setCollateralBorrowingRate(int newRate) internal {
        vaultB().setDebtScalingRate(newRate/1e2);
        vaultA().setBalanceScalingRate(newRate * int(ratioVaultABorrowed()) / 1e20);
    }

    function mintStabletoken(address _to, uint _amount) internal {
        vaultA().setAmountMinted(vaultA().amountMinted().plus(_amount));
        stableToken().issue(_to, _amount);
    }

    function getCollateralToken(IVault _vault) public view returns(IERC20Token) {
        if (address(_vault) == address(vaultA())) {
            return collateralToken();
        } else {
            return stableToken();
        }
    }

    function getDebtToken(IVault _vault) public view returns(ISmartToken) {
        if (address(_vault) == address(vaultA())) {
            return stableToken();
        } else {
            return collateralToken();
        }
    }

}