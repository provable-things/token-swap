// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 < 0.8.0;

interface IERC20_MINTABLE {
    function mint(address _to, uint256 _amount) external returns (bool success);
}
