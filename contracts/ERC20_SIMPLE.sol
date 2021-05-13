// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 < 0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20_SIMPLE is ERC20 {

    address public OWNER;
    address public ADMIN;

    constructor()
        ERC20("ERC20", "ERC")
    {
        OWNER = msg.sender;
        ADMIN = msg.sender;
        _mint(msg.sender, 1e18);
    }

    modifier onlyOwner() {
        require(msg.sender == OWNER, 'Only `OWNER` can call this function!');
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == ADMIN, 'Only `ADMIN` can call this function!');
        _;
    }

    function setAdmin(
        address _admin
    )
        external
        onlyOwner
    {
        ADMIN = _admin;
    }

    function mint(
        address _to,
        uint256 _amount
    )
        external
        onlyAdmin
        returns (bool success)
    {
        require(_to != address(0), "Cannot mint to the zero address!");
        _mint(_to, _amount);
        return true;
    }

    function burn(
        uint256 _amount
    )
        external
    {
        _burn(msg.sender, _amount);
    }
}
