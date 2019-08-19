pragma solidity ^0.4.23;

import "./interfaces/IERC20Token.sol";
import "./interfaces/IPegSettings.sol";
import "./interfaces/IPegLogic.sol";
import "./interfaces/IVault.sol";
import "./interfaces/ILogicActions.sol";
import "./interfaces/IContractRegistry.sol";
import "./ContractIds.sol";

contract Auction is ContractIds {
    address public borrower;
    IVault public vault;
    IContractRegistry public registry;
    uint public auctionEndTime;
    uint public auctionStartTime;
    address public highestBidder;
    uint256 public highestBid;
    uint256 public lowestBidRelay;
    uint256 public amountToPay;
    bool ended;

    event HighestBidIncreased(address indexed _bidder, uint256 _amount, uint256 _amountRelay);

    constructor(IContractRegistry _registry, IVault _vault, address _borrower) public {
        registry = _registry;
        borrower = _borrower;
        vault = _vault;
    }

    modifier authOnly() {
        require(IPegSettings(registry.addressOf(ContractIds.PEG_SETTINGS)).authorized(msg.sender), "Unauthorized");
        _;
    }

    function validateBid(uint256 _amount, uint256 _amountRelay) internal view {
        if(auctionEndTime > 0)
            require(now <= auctionEndTime, "Auction has already ended");
        else {
            auctionStartTime = now;
            auctionEndTime = now + vault.biddingTime();
        }
        require(_amount == 0 || _amountRelay == 0, "Can't refund collateral and mint relay tokens");
        if(highestBidder != address(0))
            require(_amount > highestBid || _amountRelay < lowestBidRelay, "There already is a higher bid");
        require(vault.balanceActualToRaw(_amount) <= vault.rawBalanceOf(address(this)), "Can't refund more than 100%");
    }

    function bid(uint256 _amount, uint256 _amountRelay) public {
        validateBid(_amount, _amountRelay);
        if(_amountRelay > 0)
            auctionEndTime = auctionStartTime + 172800; // extends to 48 hours auction
        IPegLogic pegLogic = IPegLogic(registry.addressOf(ContractIds.PEG_LOGIC));
        if(amountToPay == 0) amountToPay = pegLogic.actualDebt(vault, address(this));
        IERC20Token token = pegLogic.getDebtToken(vault);
        token.transferFrom(msg.sender, address(this), amountToPay);
        if (highestBidder != address(0)) {
            require(token.transfer(highestBidder, amountToPay), "Error transferring token to last highest bidder.");
        } else {
            ILogicActions logicActions = ILogicActions(registry.addressOf(ContractIds.PEG_LOGIC_ACTIONS));
            if (address(vault) == registry.addressOf(ContractIds.VAULT_B))
                token.approve(address(logicActions), amountToPay);
            logicActions.repayAuction(vault, borrower, amountToPay);
        }
        highestBidder = msg.sender;
        highestBid = _amount;
        lowestBidRelay = _amountRelay;
        emit HighestBidIncreased(msg.sender, _amount, _amountRelay);
    }

    function auctionEnd() public authOnly {
        require(auctionEndTime > 0, "Bidding has not started yet");
        require(now >= auctionEndTime, "Auction end time is in the future");
        require(!ended, "Auction already ended");
        ended = true;
    }

    function hasEnded() public view returns (bool) {
        return auctionEndTime > 0 && now >= auctionEndTime;
    }

    function transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public authOnly {
        _token.transfer(_to, _amount);
    }
}