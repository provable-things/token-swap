// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 < 0.8.0;

import "./IERC20_MINTABLE.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";


contract TOKEN_SWAP is IERC777Recipient {

    address public LOTTO;
    address public PLOTTO;

    bytes32 constant private ERC777_TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
    IERC1820Registry private ERC1820_CONTRACT = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    IERC20_MINTABLE public LOTTO_CONTRACT;

    constructor(
        address _lotto,
        address _pLotto
    ) {
        LOTTO = _lotto;
        PLOTTO = _pLotto;
        ERC1820_CONTRACT.setInterfaceImplementer(address(this), ERC777_TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
        LOTTO_CONTRACT = IERC20_MINTABLE(_lotto);
    }

    function tokensReceived(
        address /* operator */,
        address from,
        address /* to */,
        uint256 amount,
        bytes calldata /* userData */,
        bytes calldata/*  operatorData */
    )
        override
        external
    {
        require(msg.sender == PLOTTO, "This contract only accepts pLotto tokens!");
        LOTTO_CONTRACT.mint(from, amount);
    }
}
