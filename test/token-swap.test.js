const {
  getContract,
  getTokenBalance,
  mintTokensTo,
} = require('./test-utils')
const assert = require('assert')
const { prop } = require('ramda')
const { expectRevert } = require('@openzeppelin/test-helpers')
const TOKEN_SWAP_ARTIFACT = artifacts.require('TOKEN_SWAP.sol')
const ERC20_SIMPLE_ARTIFACT = artifacts.require('ERC20_SIMPLE.sol')
const PTOKEN_SIMPLE_ARTIFACT = artifacts.require('PTOKEN_SIMPLE.sol')
const { encodePTokenMetadata } = require('./ptoken-metadata-encoder')

contract('TOKEN_SWAP', ([ OWNER_ADDRESS, TOKEN_HOLDER_ADDRESS ]) => {
  let getUserLottoBalance, getUserPLottoBalance, getTokenSwapContractPLottoBalance
  let PLOTTO_METHODS, LOTTO_METHODS, TOKEN_SWAP_METHODS, PLOTTO_ADDRESS, LOTTO_ADDRESS, TOKEN_SWAP_ADDRESS

  const GAS_LIMIT = 3e6
  const EMPTY_DATA = '0x'
  const TOKEN_AMOUNT = 1337

  beforeEach(async () => {
    const LOTTO_CONTRACT = await getContract(web3, ERC20_SIMPLE_ARTIFACT)
    LOTTO_METHODS = prop('methods', LOTTO_CONTRACT)
    LOTTO_ADDRESS = prop('_address', LOTTO_CONTRACT)

    const PLOTTO_CONTRACT = await getContract(web3, PTOKEN_SIMPLE_ARTIFACT)
    PLOTTO_METHODS = prop('methods', PLOTTO_CONTRACT)
    PLOTTO_ADDRESS = prop('_address', PLOTTO_CONTRACT)

    const TOKEN_SWAP_CONTRACT = await getContract(web3, TOKEN_SWAP_ARTIFACT, [ LOTTO_ADDRESS, PLOTTO_ADDRESS ])
    TOKEN_SWAP_METHODS = prop('methods', TOKEN_SWAP_CONTRACT)
    TOKEN_SWAP_ADDRESS = prop('_address', TOKEN_SWAP_CONTRACT)

    await LOTTO_METHODS.setAdmin(TOKEN_SWAP_ADDRESS).send({ from: OWNER_ADDRESS })

    // Define some helper fxns...
    getUserLottoBalance = _ => getTokenBalance(TOKEN_HOLDER_ADDRESS, LOTTO_METHODS)
    getUserPLottoBalance = _ => getTokenBalance(TOKEN_HOLDER_ADDRESS, PLOTTO_METHODS)
    getTokenSwapContractPLottoBalance = _ => getTokenBalance(TOKEN_SWAP_ADDRESS, PLOTTO_METHODS)
  })

  it('Sending `pLOTTO` tokens to `TOKEN_SWAP contract should mint `Lotto` tokens`', async () => {
    // Assert zero balances...
    assert.strictEqual(await getUserLottoBalance(), 0)
    assert.strictEqual(await getUserPLottoBalance(), 0)
    assert.strictEqual(await getTokenSwapContractPLottoBalance(), 0)

    // Mint pLotto to user...
    await mintTokensTo(PLOTTO_METHODS, OWNER_ADDRESS, TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT)

    // Assert correct balances after pLotto mint...
    assert.strictEqual(await getUserLottoBalance(), 0)
    assert.strictEqual(await getUserPLottoBalance(), TOKEN_AMOUNT)
    assert.strictEqual(await getTokenSwapContractPLottoBalance(), 0)

    // User sends their `pLotto` tokens to the token swap contract...
    await PLOTTO_METHODS
      .send(TOKEN_SWAP_ADDRESS, TOKEN_AMOUNT, EMPTY_DATA)
      .send({ from: TOKEN_HOLDER_ADDRESS, gas: GAS_LIMIT })

    // Assert final balances...
    assert.strictEqual(await getUserPLottoBalance(), 0)
    assert.strictEqual(await getUserLottoBalance(), TOKEN_AMOUNT)
    assert.strictEqual(await getTokenSwapContractPLottoBalance(), TOKEN_AMOUNT)
  })

  it('Sending ERC777 tokens other than `pLOTTO` to the `TOKEN_SWAP` contract should revert', async () => {
    const ERC777_CONTRACT = await getContract(web3, PTOKEN_SIMPLE_ARTIFACT)
    const ERC777_METHODS = prop('methods', ERC777_CONTRACT)
    const ERC777_ADDRESS = prop('_address', ERC777_CONTRACT)
    assert.notStrictEqual(ERC777_ADDRESS, PLOTTO_ADDRESS)
    await mintTokensTo(ERC777_METHODS, OWNER_ADDRESS, TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT)
    await expectRevert(
      ERC777_METHODS
        .send(TOKEN_SWAP_ADDRESS, TOKEN_AMOUNT, EMPTY_DATA)
        .send({ from: TOKEN_HOLDER_ADDRESS, gas: GAS_LIMIT }),
      'This contract only accepts pLotto tokens!',
    )
  })

  it('Redeeming `pLotto` tokens will burn `Lotto` tokens', async () => {
    const REDEEM_AMOUNT = Math.floor(TOKEN_AMOUNT / 2)
    await mintTokensTo(PLOTTO_METHODS, OWNER_ADDRESS, TOKEN_HOLDER_ADDRESS, TOKEN_AMOUNT)
    await PLOTTO_METHODS
      .send(TOKEN_SWAP_ADDRESS, TOKEN_AMOUNT, EMPTY_DATA)
      .send({ from: TOKEN_HOLDER_ADDRESS, gas: GAS_LIMIT })
    const lottoBalanceBefore = await getTokenBalance(TOKEN_HOLDER_ADDRESS, LOTTO_METHODS)
    const pLottoBalanceBefore = await getTokenBalance(TOKEN_HOLDER_ADDRESS, PLOTTO_METHODS)
    assert.strictEqual(lottoBalanceBefore, TOKEN_AMOUNT)
    assert.strictEqual(pLottoBalanceBefore, 0)
    await TOKEN_SWAP_METHODS.redeemPLotto(REDEEM_AMOUNT).send({ from: TOKEN_HOLDER_ADDRESS, gas: GAS_LIMIT })
    const lottoBalanceAfter = await getTokenBalance(TOKEN_HOLDER_ADDRESS, LOTTO_METHODS)
    const pLottoBalanceAfter = await getTokenBalance(TOKEN_HOLDER_ADDRESS, PLOTTO_METHODS)
    assert.strictEqual(lottoBalanceAfter, lottoBalanceBefore - REDEEM_AMOUNT)
    assert.strictEqual(pLottoBalanceAfter, REDEEM_AMOUNT)
  })

  it('pLotto minted by the Provable bridge with the correct metadata will mint Lotto tokes in one tx', async () => {
    // Dummy values to create `pTokenMetadata` with...
    const PTOKEN_METADATA_DUMMY_METADATA_VERSION = '0x01'
    const PTOKEN_METADATA_DUMMY_PROTOCOL_ID = '0x005fe7f9'
    const PTOKEN_METADATA_DUMMY_ORIGIN_ADDRESS = '0x7eef81767e36269db39ffa6271cc4325cbc59cfe'

    // ABI Encode the destination recipient address as 'userData'...
    const userData = web3.eth.abi.encodeParameters(['address'], [TOKEN_HOLDER_ADDRESS])

    // Use the 'userData' when encoding the pToken metadata...
    const pTokenMetadata = encodePTokenMetadata(
      web3,
      PTOKEN_METADATA_DUMMY_METADATA_VERSION,
      userData,
      PTOKEN_METADATA_DUMMY_PROTOCOL_ID,
      PTOKEN_METADATA_DUMMY_ORIGIN_ADDRESS,
    )

    // Assert balances before...
    const tokenSwapContractPLottoBalanceBefore = await getTokenBalance(TOKEN_SWAP_ADDRESS, PLOTTO_METHODS)
    assert.strictEqual(tokenSwapContractPLottoBalanceBefore, 0)
    const tokenHolderLottoBalanceBefore = await getTokenBalance(TOKEN_HOLDER_ADDRESS, LOTTO_METHODS)
    assert.strictEqual(tokenHolderLottoBalanceBefore, 0)

    // Mint pLotto tokens to the `TOKEN_SWAP_ADDRESS` with the final user's destination address encoded in the metadata.
    await PLOTTO_METHODS['mint(address,uint256,bytes,bytes)'](
      TOKEN_SWAP_ADDRESS,
      TOKEN_AMOUNT,
      pTokenMetadata,
      EMPTY_DATA, // NOTE: Unused ERC777-specific param: `operatorData`
    ).send({ from: OWNER_ADDRESS, gas: GAS_LIMIT })

    // Assert balances after...
    const tokenSwapContractPLottoBalanceAfter = await getTokenBalance(TOKEN_SWAP_ADDRESS, PLOTTO_METHODS)
    assert.strictEqual(tokenSwapContractPLottoBalanceAfter, TOKEN_AMOUNT)
    const tokenHolderLottoBalanceAfter = await getTokenBalance(TOKEN_HOLDER_ADDRESS, LOTTO_METHODS)
    assert.strictEqual(tokenHolderLottoBalanceAfter, TOKEN_AMOUNT)
  })
})
