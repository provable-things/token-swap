// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 < 0.8.0;

interface TOKEN_SWAP_INTERFACE {
    function redeemOriginChainLottoTokens(
        uint256 _amount,
        address _redeemer,
        bytes memory _userData,
        string memory _underlyingAssetRecipient
    ) external;
}
