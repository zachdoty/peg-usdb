pragma solidity ^0.4.23;
import "./SafeMath.sol";

contract Array {

    uint256[] private data;
    using SafeMath for uint256;
    
    constructor () public {}

    function set(uint256[] _data) public {
        data = _data;
    }

    function addItem(uint256 _value) public {
        data.push(_value);
    }

    function get() public view returns (uint256[]) {
        return data;
    }

    function sort_item(uint pos) internal returns (bool) {
        uint w_min = pos;
        for(uint i = pos;i < data.length;i++) {
            if(data[i] < data[w_min]) {
                w_min = i;
            }
        }
        if(w_min == pos) return false;
        uint256 tmp = data[pos];
        data[pos] = data[w_min];
        data[w_min] = tmp;
        return true;
    }

    function sort() public {
        for(uint i = 0;i < data.length-1;i++) {
            sort_item(i);
        }
    }

    function getMedian() public view returns (uint256) {
        sort();
        uint256 median = 0;
        uint length = data.length;
        if (length % 2 == 0) {
            // Even number of items, grab middle ones and average
            uint256 one = data[(length / 2) - 1];
            uint256 two = data[length / 2];
            median = (one + two) / 2;
        } else {
            median = data[(length - 1) / 2];
        }
        return median;
    }
}
