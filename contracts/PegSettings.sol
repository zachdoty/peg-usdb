pragma solidity ^0.4.23;

import "./interfaces/IERC20Token.sol";
import "./library/Owned.sol";

contract PegSettings is Owned {

    mapping (address => bool) public authorized;

    event Authorize(address _address, bool _auth);

    constructor(address[] _defaultAddresses) public {
        for (uint i = 0; i < _defaultAddresses.length; i++) {
            authorized[_defaultAddresses[i]] = true;
        }
        authorized[msg.sender] = true;
    }

    modifier authOnly() {
        require(authorized[msg.sender] == true, "Unauthorized");
        _;
    }

    function authorize(address _address, bool _auth) public ownerOnly {
        emit Authorize(_address, _auth);
        authorized[_address] = _auth;
    }

    function transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public authOnly {
        _token.transfer(_to, _amount);
    }

}