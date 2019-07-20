pragma solidity ^0.4.23;

import "./IVault.sol";

contract IAuction {

    function highestBidder() public view returns (address);
    function highestBid() public view returns (uint256);

    function bid(uint256 _amount) public;
    function auctionEnd() public;

    function hasEnded() public view returns (bool);

    function transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public;

}