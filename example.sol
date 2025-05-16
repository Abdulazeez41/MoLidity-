// examples/MyContract.sol
pragma solidity ^0.8.0;

contract MyContract {
    uint256 private value;

    function storeValue(uint256 x) public {
        value = x;
    }

    function getValue() public view returns (uint256) {
        return value;
    }
}