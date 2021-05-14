const {
  getContract,
  getTokenBalance,
} = require('./test-utils')
const assert = require('assert')
const { prop } = require('ramda')
const { expectRevert } = require('@openzeppelin/test-helpers')
const LOTTO_ARTIFACT = artifacts.require('LOTTO.sol')

contract('LOTTO', ([ , TOKEN_SWAP_CONTRACT_ADDRESS, NON_TOKEN_SWAP_CONTRACT_ADDRESS, USER, NON_USER ]) => {
  let LOTTO_TOKEN_METHODS, getUserTokenBalance
  const GAS_LIMIT = 3e6
  const TOKEN_AMOUNT = 1337

  beforeEach(async () => {
    const LOTTO_TOKEN_CONTRACT = await getContract(web3, LOTTO_ARTIFACT, [ TOKEN_SWAP_CONTRACT_ADDRESS ])
    LOTTO_TOKEN_METHODS = prop('methods', LOTTO_TOKEN_CONTRACT)
    assert.notStrictEqual(TOKEN_SWAP_CONTRACT_ADDRESS, NON_TOKEN_SWAP_CONTRACT_ADDRESS)
    getUserTokenBalance = _ => getTokenBalance(USER, LOTTO_TOKEN_METHODS)
  })

  it('`TOKEN_SWAP_CONTRACT_ADDRESS` can mint tokens', async () => {
    assert.strictEqual(await getUserTokenBalance(), 0)
    await LOTTO_TOKEN_METHODS
      .mint(USER, TOKEN_AMOUNT)
      .send({ from: TOKEN_SWAP_CONTRACT_ADDRESS, gas: GAS_LIMIT })
    assert.strictEqual(await getUserTokenBalance(), TOKEN_AMOUNT)
  })

  it('`NON_TOKEN_SWAP_CONTRACT_ADDRESS` cannot mint', async () => {
    assert.notStrictEqual(TOKEN_SWAP_CONTRACT_ADDRESS, NON_TOKEN_SWAP_CONTRACT_ADDRESS)
    await expectRevert(
      LOTTO_TOKEN_METHODS
        .mint(USER, TOKEN_AMOUNT)
        .send({ from: NON_TOKEN_SWAP_CONTRACT_ADDRESS, gas: GAS_LIMIT }),
      'Only the token-swap contract can call this function!',
    )
  })

  it('`TOKEN_SWAP_CONTRACT_ADDRESS` can burn tokens', async () => {
    const BURN_AMOUNT = Math.floor(TOKEN_AMOUNT / 2)
    assert(BURN_AMOUNT <= TOKEN_AMOUNT)
    await LOTTO_TOKEN_METHODS
      .mint(USER, TOKEN_AMOUNT)
      .send({ from: TOKEN_SWAP_CONTRACT_ADDRESS, gas: GAS_LIMIT })
    const userTokenBalanceBefore = await getUserTokenBalance()
    assert.strictEqual(userTokenBalanceBefore, TOKEN_AMOUNT)
    await LOTTO_TOKEN_METHODS
      .burn(USER, BURN_AMOUNT)
      .send({ from: TOKEN_SWAP_CONTRACT_ADDRESS, gas: GAS_LIMIT })
    assert.strictEqual(await getUserTokenBalance(), parseInt(userTokenBalanceBefore) - BURN_AMOUNT)
  })

  it('`NON_TOKEN_SWAP_CONTRACT_ADDRESS` cannot burn tokens', async () => {
    const BURN_AMOUNT = Math.floor(TOKEN_AMOUNT / 2)
    assert(BURN_AMOUNT <= TOKEN_AMOUNT)
    await LOTTO_TOKEN_METHODS
      .mint(USER, TOKEN_AMOUNT)
      .send({ from: TOKEN_SWAP_CONTRACT_ADDRESS, gas: GAS_LIMIT })
    const userTokenBalanceBefore = await getTokenBalance(USER, LOTTO_TOKEN_METHODS)
    assert.strictEqual(userTokenBalanceBefore, TOKEN_AMOUNT)
    await expectRevert(
      LOTTO_TOKEN_METHODS
        .burn(USER, BURN_AMOUNT)
        .send({ from: NON_TOKEN_SWAP_CONTRACT_ADDRESS, gas: GAS_LIMIT }),
      'Only the token-swap contract can call this function!',
    )
    assert.strictEqual(await getUserTokenBalance(), userTokenBalanceBefore)
  })

  it('Cannot redeem origin chain Lotto tokens if insufficient balance', async () => {
    assert(await getTokenBalance(NON_USER, LOTTO_TOKEN_METHODS) < TOKEN_AMOUNT)
    await expectRevert(
      LOTTO_TOKEN_METHODS
        .redeemOriginChainLottoTokens(TOKEN_AMOUNT)
        .send({ from: NON_USER, gas: GAS_LIMIT }),
      'Insufficient balance to redeem origin chain Lotto tokens!',
    )
  })
})
