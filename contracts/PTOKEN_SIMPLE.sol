// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 < 0.8.0;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

contract PTOKEN_SIMPLE is ERC777 {

    address public MINTER;

    event Redeem(
        address indexed redeemer,
        uint256 value,
        string underlyingAssetRecipient,
        bytes userData
    );

    constructor()
        ERC777("ERC777_TOKEN", "ERC777", new address[](0))
    {
        MINTER = msg.sender;
    }

    function mint(
        address recipient,
        uint256 value
    )
        external
        returns (bool)
    {
        mint(recipient, value, "", "");
        return true;
    }

    function mint(
        address recipient,
        uint256 value,
        bytes memory userData,
        bytes memory operatorData
    )
        public
        returns (bool)
    {
        require(recipient != address(this) , "Recipient cannot be the this token contract address!");
        require(msg.sender == MINTER, "Caller is not the minter");
        _mint(recipient, value, userData, operatorData);
        return true;
    }

    function redeem(
        uint256 amount,
        string calldata underlyingAssetRecipient
    )
        external
        returns (bool)
    {
        redeem(amount, "", underlyingAssetRecipient);
        return true;
    }

    function redeem(
        uint256 amount,
        bytes memory userData,
        string memory underlyingAssetRecipient
    )
        public
    {
        _burn(msg.sender, amount, userData, "");
        emit Redeem(msg.sender, amount, underlyingAssetRecipient, userData);
    }

    function operatorRedeem(
        address account,
        uint256 amount,
        bytes calldata userData,
        bytes calldata operatorData,
        string calldata underlyingAssetRecipient
    )
        external
    {
        require(isOperatorFor(msg.sender, account), "ERC777: caller is not an operator for holder");
        _burn(account, amount, userData, operatorData);
        emit Redeem(account, amount, underlyingAssetRecipient, userData);
    }
}
