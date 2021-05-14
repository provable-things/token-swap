// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 < 0.8.0;

import "./IERC20_SIMPLE.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";


contract TOKEN_SWAP is IERC777Recipient {

    address public LOTTO_ADDRESS;
    address public PLOTTO_ADDRESS;
    uint256 constant ETH_WORD_SIZE = 32;

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
        address /* _operator */,
        address _from,
        address /* _to */,
        uint256 _amount,
        bytes calldata  _pTokenMetadata,
        bytes calldata/*  _operatorData */
    )
        override
        external
    {
        require(msg.sender == PLOTTO_ADDRESS, "This contract only accepts pLotto tokens!");
        address destinationAddress = _from == address(0)
            // This is a pLotto token MINT to this token-swap contract, ∴ the `_from` is address(0).
            ? decodeDestinationAddressFromUserData(getUserDataFromPtokenMetadata(_pTokenMetadata))
            // This is a pLotto token TRANSFER to this token-swap contract, ∴ `_from` is to whom we mint Lotto tokens.
            : _from;
        LOTTO_CONTRACT.mint(destinationAddress, _amount);
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

    function decodePTokenMetdata(
        bytes memory _metadata
    )
        pure
        internal
        returns (bytes1, bytes memory, bytes4, address)
    {
        require(_metadata.length >= ETH_WORD_SIZE * 6, "Not enough data to decode pToken metadata!");
        (bytes1 version, bytes memory userData, bytes4 protocolId, address originAddress) = abi.decode(
            _metadata,
            (bytes1, bytes, bytes4, address)
        );
        return (version, userData, protocolId, originAddress);
    }

    function getUserDataFromPtokenMetadata(
        bytes memory _metadata
    )
        internal
        pure
        returns (bytes memory)
    {
        (, bytes memory userData, ,) = decodePTokenMetdata(_metadata);
        return userData;
    }

    function decodeDestinationAddressFromUserData(
        bytes memory _userData
    )
        pure
        internal
        returns (address)
    {
        require(_userData.length == ETH_WORD_SIZE, "Incorrect number of bytes in `userData` to decode an ETH address!");
        (address destinationAddress) = abi.decode(_userData, (address));
        return destinationAddress;
    }
}
