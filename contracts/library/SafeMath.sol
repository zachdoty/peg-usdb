pragma solidity ^0.4.23;

library SafeMath {
    function plus(uint256 _a, uint256 _b) internal pure returns (uint256) {
        uint256 c = _a + _b;
        assert(c >= _a);
        return c;
    }

    function plus(int256 _a, int256 _b) internal pure returns (int256) {
        int256 c = _a + _b;
        assert((_b >= 0 && c >= _a) || (_b < 0 && c < _a));
        return c;
    }

    function minus(uint256 _a, uint256 _b) internal pure returns (uint256) {
        assert(_a >= _b);
        return _a - _b;
    }

    function minus(int256 _a, int256 _b) internal pure returns (int256) {
        int256 c = _a - _b;
        assert((_b >= 0 && c <= _a) || (_b < 0 && c > _a));
        return c;
    }

    function times(uint256 _a, uint256 _b) internal pure returns (uint256) {
        if (_a == 0) {
            return 0;
        }
        uint256 c = _a * _b;
        assert(c / _a == _b);
        return c;
    }

    function times(int256 _a, int256 _b) internal pure returns (int256) {
        if (_a == 0) {
            return 0;
        }
        int256 c = _a * _b;
        assert(c / _a == _b);
        return c;
    }

    function toInt256(uint256 _a) internal pure returns (int256) {
        assert(_a <= 2 ** 255);
        return int256(_a);
    }

    function toUint256(int256 _a) internal pure returns (uint256) {
        assert(_a >= 0);
        return uint256(_a);
    }

    function div(uint256 _a, uint256 _b) internal pure returns (uint256) {
        return _a / _b;
    }

    function div(int256 _a, int256 _b) internal pure returns (int256) {
        return _a / _b;
    }
}
