// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 < 0.8.0;

import "./IERC20_SIMPLE.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";


contract TOKEN_SWAP is IERC777Recipient {

    address public LOTTO_ADDRESS;
    address public PLOTTO_ADDRESS;

    IERC777 public PLOTTO_CONTRACT;
    IERC20_SIMPLE public LOTTO_CONTRACT;

    bytes32 constant private ERC777_TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
    IERC1820Registry private ERC1820_CONTRACT = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);

    constructor(
        address _lottoAddress,
        address _pLottoAddress
    ) {
        LOTTO_ADDRESS = _lottoAddress;
        PLOTTO_ADDRESS = _pLottoAddress;
        PLOTTO_CONTRACT = IERC777(_pLottoAddress);
        LOTTO_CONTRACT = IERC20_SIMPLE(_lottoAddress);
        ERC1820_CONTRACT.setInterfaceImplementer(address(this), ERC777_TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
    }

    function tokensReceived(
        address /* operator */,
        address _from,
        address /* to */,
        uint256 _amount,
        bytes calldata /* userData */,
        bytes calldata/*  operatorData */
    )
        override
        external
    {
        require(msg.sender == PLOTTO_ADDRESS, "This contract only accepts pLotto tokens!");
        LOTTO_CONTRACT.mint(_from, _amount);
    }

    function redeemPLotto(
        uint256 _amount
    )
        external
    {
        redeemPLotto(_amount, "");
    }

    function redeemPLotto(
        uint256 _amount,
        bytes memory _userData
    )
        public
    {
        LOTTO_CONTRACT.burn(msg.sender, _amount);
        PLOTTO_CONTRACT.send(msg.sender, _amount, _userData);
    }
}
