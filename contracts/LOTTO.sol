// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 < 0.8.0;

import "./TOKEN_SWAP_INTERFACE.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LOTTO is ERC20 {

    address public OWNER;
    address public TOKEN_SWAP_CONTRACT_ADDRESS;
    TOKEN_SWAP_INTERFACE public TOKEN_SWAP_CONTRACT;

    constructor(
        address _tokenSwapContractAddress
    )
        ERC20("LOTTO", "ERC")
    {
        OWNER = msg.sender;
        TOKEN_SWAP_CONTRACT_ADDRESS = _tokenSwapContractAddress;
        TOKEN_SWAP_CONTRACT = TOKEN_SWAP_INTERFACE(_tokenSwapContractAddress);
    }

    modifier onlyOwner() {
        require(msg.sender == OWNER, 'Only `OWNER` can call this function!');
        _;
    }

    modifier onlyTokenSwapContract() {
        require(msg.sender == TOKEN_SWAP_CONTRACT_ADDRESS, 'Only the token-swap contract can call this function!');
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
        uint256 _amount,
        string memory _underlyingAssetRecipient
    )
        external
    {
        redeemOriginChainLottoTokens(_amount, _underlyingAssetRecipient, '');
    }

    /**
     * @dev     This function allows a user to redeem their Lotto tokes on the origin chain in a single transaction.
     *          The transaction calls the `redeemOriginChainLottoTokens` in the token-swap contract, which fxn
     *          fist burns the `_amount` of tokens on behalf of the function call. The fxn then calls `redeem` on
     *          the `pLotto` contract which burns the `_amount` of pLotto tokens, and then fires the `redeem` event.
     *          The pTokens bridge will witness this `redeem` event and act upon it, returning the `_amount` of
     *          origin-chain Lotto tokens to the `_underlyingAssetRecipient` address.
     *
     * @param _amount                       The amount of Lotto tokens to redeem.
     * @param _underlyingAssetRecipient     The recipient of the Lotto tokens on the origin chain.
     * @param _userData                     Any data the user wants to send over to the origin chain.
     */
    function redeemOriginChainLottoTokens(
        uint256 _amount,
        string memory _underlyingAssetRecipient,
        bytes memory _userData
    )
        public
    {
        require(_amount <= balanceOf(msg.sender), "Insufficient balance to redeem origin chain Lotto tokens!");
        TOKEN_SWAP_CONTRACT.redeemOriginChainLottoTokens(_amount, msg.sender, _userData, _underlyingAssetRecipient);
    }
}
