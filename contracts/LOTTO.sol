// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 < 0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./TOKEN_SWAP_INTERFACE.sol";

contract LOTTO is ERC20 {

    address public OWNER;
    address public TOKEN_SWAP_CONTRACT;

    constructor(
        address _tokenSwapContract
    )
        ERC20("LOTTO", "ERC")
    {
        OWNER = msg.sender;
        TOKEN_SWAP_CONTRACT = _tokenSwapContract;
    }

    modifier onlyOwner() {
        require(msg.sender == OWNER, 'Only `OWNER` can call this function!');
        _;
    }

    modifier onlyTokenSwapContract() {
        require(msg.sender == TOKEN_SWAP_CONTRACT, 'Only the token-swap contract can call this function!');
        _;
    }

    function mint(
        address _to,
        uint256 _amount
    )
        external
        onlyTokenSwapContract
        returns (bool success)
    {
        require(_to != address(0), "Cannot mint to the zero address!");
        _mint(_to, _amount);
        return true;
    }

    function burn(
        address _from,
        uint256 _amount
    )
        external
        onlyTokenSwapContract
    {
        _burn(_from, _amount);
    }

    function redeemOriginChainLottoTokens(
        uint256 _amount
    )
        external
    {
        require(_amount <= balanceOf(msg.sender), "Insufficient balance to redeem origin chain Lotto tokens!");
    }
}
