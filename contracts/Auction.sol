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
    address public highestBidder;
    uint256 public highestBid;
    uint256 public amountToPay;
    uint256 public pendingReturn;
    bool ended;

    event HighestBidIncreased(address indexed _bidder, uint256 _amount);

    constructor(IContractRegistry _registry, IVault _vault, address _borrower) public {
        registry = _registry;
        borrower = _borrower;
        vault = _vault;
    }

    modifier authOnly() {
        require(IPegSettings(registry.addressOf(ContractIds.PEG_SETTINGS)).authorized(msg.sender), "Unauthorized");
        _;
    }

    function bid(uint256 _amount) public {
        if(auctionEndTime > 0)
            require(now <= auctionEndTime, "Auction has already ended");
        else
            auctionEndTime = now + vault.biddingTime();
        require(_amount > highestBid, "There already is a higher bid");
        require(vault.balanceActualToRaw(_amount) <= vault.rawBalanceOf(address(this)), "Incorrect bid amount");
        IPegLogic pegLogic = IPegLogic(registry.addressOf(ContractIds.PEG_LOGIC));
        if(amountToPay == 0) amountToPay = pegLogic.actualDebt(vault, address(this));
        IERC20Token token = pegLogic.getDebtToken(vault);
        token.transferFrom(msg.sender, address(this), amountToPay);
        if (highestBid != 0) {
            require(token.transfer(highestBidder, pendingReturn), "Error transferring token to last highest bidder.");
        } else {
            ILogicActions logicActions = ILogicActions(registry.addressOf(ContractIds.PEG_LOGIC_ACTIONS));
            if (address(vault) == registry.addressOf(ContractIds.VAULT_B))
                token.approve(address(logicActions), amountToPay);
            logicActions.repayAuction(vault, borrower, amountToPay);
        }
        pendingReturn = amountToPay;
        highestBidder = msg.sender;
        highestBid = _amount;
        emit HighestBidIncreased(msg.sender, _amount);
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