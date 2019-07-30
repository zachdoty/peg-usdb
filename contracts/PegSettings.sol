pragma solidity ^0.4.23;

import "./interfaces/IERC20Token.sol";

contract PegSettings {

    mapping (address => bool) public authorized;

    address[] public signers;
    mapping (address => bool) public isSigner;

    mapping (bytes32 => mapping(address => bool)) voters;
    mapping (bytes32 => uint) votes;

    // keccak256("authorize(address addr,bool auth)")
    bytes32 constant TX_HASH = 0x74d223e22ffbdf8658f63d8153f329dab9a50f541fa0daad393938ef164821cb;

    event Authorize(address _address, bool _auth);

    constructor(address[] _signers, address[] _defaultAddresses) public {
        require(_signers.length > 0, "Signers are required");
        uint i;
        for (i = 0; i < _signers.length; i++) {
            require(!isSigner[_signers[i]], "Duplicate signers entry");
            isSigner[_signers[i]] = true;
        }
        signers = _signers;
        for (i = 0; i < _defaultAddresses.length; i++) {
            authorized[_defaultAddresses[i]] = true;
        }
        authorized[msg.sender] = true;
    }

    modifier authOnly() {
        require(authorized[msg.sender] == true, "Unauthorized");
        _;
    }

    modifier signersOnly() {
        require(isSigner[msg.sender] == true, "Forbidden");
        _;
    }

    function authorize(address addr, bool auth) public signersOnly {
        bytes32 inputHash = keccak256(abi.encode(TX_HASH, addr, auth));
        require(!voters[inputHash][msg.sender], "Re-entry");
        voters[inputHash][msg.sender] = true;
        votes[inputHash] += 1;
        if(votes[inputHash] == signers.length) {
            emit Authorize(addr, auth);
            authorized[addr] = auth;
        }
    }

    function transferERC20Token(IERC20Token _token, address _to, uint256 _amount) public authOnly {
        _token.transfer(_to, _amount);
    }
    
}