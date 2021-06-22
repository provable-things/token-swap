// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 < 0.8.0;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

interface PTOKEN_INTERFACE {
    function send(address recipient, uint256 amount, bytes calldata data) external;
    function redeem(uint256 _amount, bytes memory _userData, string memory _underlyingAssetRecipient) external;
}
