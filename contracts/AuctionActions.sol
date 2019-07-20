pragma solidity ^0.4.23;

import "./Helpers.sol";
import "./library/AntiERC20Sink.sol";
import "./library/SafeMath.sol";
import "./interfaces/IAuction.sol";
import "./interfaces/IPegLogic.sol";
import "./Auction.sol";
import "./interfaces/IVault.sol";

contract AuctionActions is AntiERC20Sink, Helpers {

    using SafeMath for uint256;
    using SafeMath for int256;

    IContractRegistry public registry;

    constructor(IContractRegistry _registry) public Helpers(_registry) {
        registry = _registry;
    }

    function startAuction(IVault _vault, address _borrower) public validate(_vault, _borrower) returns(address) {
        require(_vault.vaultExists(_borrower), "Invalid vault");
        address auctionAddress = _vault.auctions(_borrower);
        require(auctionAddress == address(0), "Vault is already on auction state");
        IPegLogic ipegLogic = pegLogic();
        require(ipegLogic.actualDebt(_vault, _borrower) > 0, "Vault has no debt");
        require(ipegLogic.isInsolvent(_vault, _borrower), "Vault is not yet for liquidation");
        Auction auction = new Auction(registry, _vault, _borrower);
        _vault.setAuctionAddress(_borrower, address(auction));
        _vault.setRawBalanceOf(address(auction), _vault.rawBalanceOf(_borrower));
        _vault.setRawDebt(address(auction), _vault.rawDebt(_borrower));
        _vault.setTotalBorrowed(address(auction), _vault.totalBorrowed(_borrower));
        _vault.setRawBalanceOf(_borrower, 0);
        _vault.setRawDebt(_borrower, 0);
        _vault.setTotalBorrowed(_borrower, 0);
        _vault.emitAuctionStarted(_borrower);
        return address(auction);
    }

    function endAuction(IVault _vault, address _borrower) public validate(_vault, _borrower) {
        require(_vault.vaultExists(_borrower), "Invalid vault");
        address auctionAddress = _vault.auctions(_borrower);
        require(auctionAddress != address(0), "Vault is not on auction state");
        IAuction auction = IAuction(auctionAddress);
        auction.auctionEnd();
        address highestBidder = auction.highestBidder();
        uint256 highestBid = _vault.balanceActualToRaw(auction.highestBid());
        _vault.setAuctionAddress(_borrower, address(0));
        _vault.create(highestBidder);
        _vault.setRawBalanceOf(
            highestBidder,
            _vault.rawBalanceOf(highestBidder).plus(_vault.rawBalanceOf(auctionAddress).minus(highestBid))
        );
        _vault.setRawBalanceOf(_borrower, _vault.rawBalanceOf(_borrower).plus(highestBid));
        pegLogic().adjustCollateralBorrowingRate();
        _vault.setRawBalanceOf(auctionAddress, 0);
        _vault.emitAuctionEnded(_borrower, highestBidder, highestBid);
    }

}