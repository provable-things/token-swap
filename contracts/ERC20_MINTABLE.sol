// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 < 0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20_MINTABLE is ERC20 {

    address public OWNER;
    address public MINTER;

    constructor()
        ERC20("ERC20", "ERC")
    {
        OWNER = msg.sender;
        MINTER = msg.sender;
        _mint(msg.sender, 1e18);
    }

    modifier onlyOwner() {
        require(msg.sender == OWNER, 'Only `OWNER` can call this function!');
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == MINTER, 'Only `MINTER` can call this function!');
        _;
    }

    function setMinter(
        address _minter
    )
        external
        onlyOwner
    {
        MINTER = _minter;
    }

    function mint(
        address _to,
        uint256 _amount
    )
        external
        onlyMinter
        returns (bool success)
    {
        require(_to != address(0), "Cannot mint to the zero address!");
        _mint(_to, _amount);
        return true;
    }
}
