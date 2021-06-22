// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 < 0.8.0;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

contract PTOKEN is ERC777 {

    address public MINTER;

    event Redeem(
        address indexed redeemer,
        uint256 value,
        string _underlyingAssetRecipient,
        bytes userData
    );

    constructor()
        ERC777("ERC777_TOKEN", "ERC777", new address[](0))
    {
        MINTER = msg.sender;
    }

    function mint(
        address _recipient,
        uint256 _value
    )
        external
        returns (bool)
    {
        mint(_recipient, _value, "", "");
        return true;
    }

    function mint(
        address _recipient,
        uint256 _value,
        bytes memory _userData,
        bytes memory _operatorData
    )
        public
        returns (bool)
    {
        require(_recipient != address(this) , "Recipient cannot be the this token contract address!");
        require(msg.sender == MINTER, "Caller is not the minter");
        _mint(_recipient, _value, _userData, _operatorData);
        return true;
    }

    function redeem(
        uint256 _amount,
        string calldata _underlyingAssetRecipient
    )
        external
        returns (bool)
    {
        redeem(_amount, "", _underlyingAssetRecipient);
        return true;
    }

    function redeem(
        uint256 _amount,
        bytes memory _userData,
        string memory _underlyingAssetRecipient
    )
        public
    {
        _burn(msg.sender, _amount, _userData, "");
        emit Redeem(msg.sender, _amount, _underlyingAssetRecipient, _userData);
    }
}
