// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 < 0.8.0;

import "./LOTTO_INTERFACE.sol";
import "./PTOKEN_INTERFACE.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777Recipient.sol";
import "@openzeppelin/contracts/introspection/IERC1820Registry.sol";


contract TOKEN_SWAP is IERC777Recipient {

    address public OWNER;
    address public LOTTO_ADDRESS;
    address public PLOTTO_ADDRESS;
    uint256 constant ETH_WORD_SIZE = 32;
    uint256 constant ETH_ADDRESS_SIZE = 20;

    LOTTO_INTERFACE public LOTTO_CONTRACT;
    PTOKEN_INTERFACE public PLOTTO_CONTRACT;

    bytes32 constant private ERC777_TOKENS_RECIPIENT_INTERFACE_HASH = keccak256("ERC777TokensRecipient");
    IERC1820Registry private ERC1820_CONTRACT = IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);

    constructor() {
        OWNER = msg.sender;
        ERC1820_CONTRACT.setInterfaceImplementer(address(this), ERC777_TOKENS_RECIPIENT_INTERFACE_HASH, address(this));
    }

    /**
     * @dev                     This is the ERC777 `tokensReceived` hook (https://eips.ethereum.org/EIPS/eip-777)
     *                          The spec requires this hook to be called whenever ERC777 tokens are sent if the
     *                          receiving contract is registered as an ERC777 token recipient, which this contract is.
     *                          (See the constructor for the ERC1820 registration.)
     *
     * @param _from             Who is sending the tokens.
     * @param _amount           The amount of tokens being sent.
     * @param _pTokenMetadata   The pToken metadata added by the pTokens core.
     *
     */
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
        address lottoTokensRecipientAddress = _from == address(0)
            // This is a pLotto token MINT to this token-swap contract, ∴ the `_from` is address(0).
            ? convertBytesToAddress(getUserDataFromPtokenMetadata(_pTokenMetadata))
            // This is a pLotto token TRANSFER to this token-swap contract, ∴ `_from` is to whom we mint Lotto tokens.
            : _from;
        LOTTO_CONTRACT.mint(lottoTokensRecipientAddress, _amount);
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

    function redeemOriginChainLottoTokens(
        uint256 _amount,
        address _redeemer,
        bytes memory _userData,
        string memory _underlyingAssetRecipient
    )
        external
    {
        require(msg.sender == LOTTO_ADDRESS, "Only Lotto contract address can call this function!");
        LOTTO_CONTRACT.burn(_redeemer, _amount);
        PLOTTO_CONTRACT.redeem(_amount, _userData, _underlyingAssetRecipient);
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

    function convertBytesToAddress(
        bytes memory _bytes
    )
        pure
        internal
        returns (address destinationAddress)
    {
        require(_bytes.length == ETH_ADDRESS_SIZE, "Incorrect number of bytes to convert to address!");
        assembly {
             destinationAddress := mload(add(_bytes, ETH_ADDRESS_SIZE))
        }
    }

    function setLottoContract(
        address _lottoAddress
    )
        external
        onlyOwner
    {
        LOTTO_ADDRESS = _lottoAddress;
        LOTTO_CONTRACT = LOTTO_INTERFACE(_lottoAddress);
    }

    function setPLottoContract(
        address _pLottoAddress
    )
        external
        onlyOwner
    {
        PLOTTO_ADDRESS = _pLottoAddress;
        PLOTTO_CONTRACT = PTOKEN_INTERFACE(_pLottoAddress);
    }

    function renounceOwnership()
        external
        onlyOwner
    {
        OWNER = address(0);
    }

    modifier onlyOwner() {
        require(msg.sender == OWNER, "Only the owner can call this function!");
        _;
    }
}
