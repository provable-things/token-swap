const {
  getContract,
  getTokenBalance,
} = require('./test-utils')
const assert = require('assert')
const { prop } = require('ramda')
const { expectRevert } = require('@openzeppelin/test-helpers')
const ERC20_SIMPLE_ARTIFACT = artifacts.require('ERC20_SIMPLE.sol')

contract('ERC20_SIMPLE', ([ , TOKEN_SWAP_CONTRACT_ADDRESS, NON_TOKEN_SWAP_CONTRACT_ADDRESS, USER, NON_USER ]) => {
  let ERC20_TOKEN_METHODS, getUserTokenBalance
  const GAS_LIMIT = 3e6
  const TOKEN_AMOUNT = 1337

  beforeEach(async () => {
    const ERC20_TOKEN_CONTRACT = await getContract(web3, ERC20_SIMPLE_ARTIFACT, [ TOKEN_SWAP_CONTRACT_ADDRESS ])
    ERC20_TOKEN_METHODS = prop('methods', ERC20_TOKEN_CONTRACT)
    assert.notStrictEqual(TOKEN_SWAP_CONTRACT_ADDRESS, NON_TOKEN_SWAP_CONTRACT_ADDRESS)
    getUserTokenBalance = _ => getTokenBalance(USER, ERC20_TOKEN_METHODS)
  })

  it('`TOKEN_SWAP_CONTRACT_ADDRESS` can mint tokens', async () => {
    assert.strictEqual(await getUserTokenBalance(), 0)
    await ERC20_TOKEN_METHODS
      .mint(USER, TOKEN_AMOUNT)
      .send({ from: TOKEN_SWAP_CONTRACT_ADDRESS, gas: GAS_LIMIT })
    assert.strictEqual(await getUserTokenBalance(), TOKEN_AMOUNT)
  })

  it('`NON_TOKEN_SWAP_CONTRACT_ADDRESS` cannot mint', async () => {
    assert.notStrictEqual(TOKEN_SWAP_CONTRACT_ADDRESS, NON_TOKEN_SWAP_CONTRACT_ADDRESS)
    await expectRevert(
      ERC20_TOKEN_METHODS
        .mint(USER, TOKEN_AMOUNT)
        .send({ from: NON_TOKEN_SWAP_CONTRACT_ADDRESS, gas: GAS_LIMIT }),
      'Only the token-swap contract can call this function!',
    )
  })

  it('`TOKEN_SWAP_CONTRACT_ADDRESS` can burn tokens', async () => {
    const BURN_AMOUNT = Math.floor(TOKEN_AMOUNT / 2)
    assert(BURN_AMOUNT <= TOKEN_AMOUNT)
    await ERC20_TOKEN_METHODS
      .mint(USER, TOKEN_AMOUNT)
      .send({ from: TOKEN_SWAP_CONTRACT_ADDRESS, gas: GAS_LIMIT })
    const userTokenBalanceBefore = await getUserTokenBalance()
    assert.strictEqual(userTokenBalanceBefore, TOKEN_AMOUNT)
    await ERC20_TOKEN_METHODS
      .burn(USER, BURN_AMOUNT)
      .send({ from: TOKEN_SWAP_CONTRACT_ADDRESS, gas: GAS_LIMIT })
    assert.strictEqual(await getUserTokenBalance(), parseInt(userTokenBalanceBefore) - BURN_AMOUNT)
  })

  it('`NON_TOKEN_SWAP_CONTRACT_ADDRESS` cannot burn tokens', async () => {
    const BURN_AMOUNT = Math.floor(TOKEN_AMOUNT / 2)
    assert(BURN_AMOUNT <= TOKEN_AMOUNT)
    await ERC20_TOKEN_METHODS
      .mint(USER, TOKEN_AMOUNT)
      .send({ from: TOKEN_SWAP_CONTRACT_ADDRESS, gas: GAS_LIMIT })
    const userTokenBalanceBefore = await getTokenBalance(USER, ERC20_TOKEN_METHODS)
    assert.strictEqual(userTokenBalanceBefore, TOKEN_AMOUNT)
    await expectRevert(
      ERC20_TOKEN_METHODS
        .burn(USER, BURN_AMOUNT)
        .send({ from: NON_TOKEN_SWAP_CONTRACT_ADDRESS, gas: GAS_LIMIT }),
      'Only the token-swap contract can call this function!',
    )
    assert.strictEqual(await getUserTokenBalance(), userTokenBalanceBefore)
  })

  it('Cannot redeem origin chain Lotto tokens if insufficient balance', async () => {
    assert(await getTokenBalance(NON_USER, ERC20_TOKEN_METHODS) < TOKEN_AMOUNT)
    await expectRevert(
      ERC20_TOKEN_METHODS
        .redeemOriginChainLottoTokens(TOKEN_AMOUNT)
        .send({ from: NON_USER, gas: GAS_LIMIT }),
      'Insufficient balance to redeem origin chain Lotto tokens!',
    )
  })
})
