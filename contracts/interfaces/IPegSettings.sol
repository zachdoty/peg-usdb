pragma solidity ^0.4.23;

import "./IERC20Token.sol";

contract IPegSettings {

    function authorized(address _address) public view returns (bool) { _address; }
    
    function authorize(address _address, bool _auth) public;
    function transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public;

}