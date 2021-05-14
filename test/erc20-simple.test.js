const {
  getContract,
  checkObjHasKey,
  getTokenBalance,
} = require('./test-utils')
const assert = require('assert')
const { prop } = require('ramda')
const { expectRevert } = require('@openzeppelin/test-helpers')
const ERC20_SIMPLE_ARTIFACT = artifacts.require('ERC20_SIMPLE.sol')

const getAdminAddress = _methods => {
  const method = 'ADMIN'
  return checkObjHasKey(_methods, method).then(_ => _methods[method]().call())
}

contract('ERC20_SIMPLE', ([ OWNER, NON_ADMIN, TOKEN_HOLDER ]) => {
  let TOKEN_METHODS, ADMIN
  const GAS_LIMIT = 3e6
  const TOKEN_AMOUNT = 1337

  beforeEach(async () => {
    const TOKEN_CONTRACT = await getContract(web3, ERC20_SIMPLE_ARTIFACT)
    TOKEN_METHODS = prop('methods', TOKEN_CONTRACT)
    ADMIN = await getAdminAddress(TOKEN_METHODS)
    assert.notStrictEqual(ADMIN, NON_ADMIN)
  })

  it('`ADMIN` can mint tokens', async () => {
    const tokenHolderBalanceBefore = await getTokenBalance(TOKEN_HOLDER, TOKEN_METHODS)
    assert.strictEqual(tokenHolderBalanceBefore, 0)
    await TOKEN_METHODS.mint(TOKEN_HOLDER, TOKEN_AMOUNT).send({ from: ADMIN, gas: GAS_LIMIT })
    const tokenHolderBalanceAfter = await getTokenBalance(TOKEN_HOLDER, TOKEN_METHODS)
    assert.strictEqual(tokenHolderBalanceAfter, TOKEN_AMOUNT)
  })

  it('Non `ADMIN` cannot mint', async () => {
    assert.notStrictEqual(ADMIN, NON_ADMIN)
    await expectRevert(
      TOKEN_METHODS.mint(TOKEN_HOLDER, TOKEN_AMOUNT).send({ from: NON_ADMIN, gas: GAS_LIMIT }),
      'Only `ADMIN` can call this function!',
    )
  })

  it('`ADMIN` can burn tokens', async () => {
    const BURN_AMOUNT = Math.floor(TOKEN_AMOUNT / 2)
    assert(BURN_AMOUNT <= TOKEN_AMOUNT)
    await TOKEN_METHODS.mint(TOKEN_HOLDER, TOKEN_AMOUNT).send({ from: ADMIN, gas: GAS_LIMIT })
    const tokenHolderBalanceBefore = await getTokenBalance(TOKEN_HOLDER, TOKEN_METHODS)
    assert.strictEqual(tokenHolderBalanceBefore, TOKEN_AMOUNT)
    await TOKEN_METHODS.burn(TOKEN_HOLDER, BURN_AMOUNT).send({ from: ADMIN, gas: GAS_LIMIT })
    const tokenHolderBalanceAfter = await getTokenBalance(TOKEN_HOLDER, TOKEN_METHODS)
    assert.strictEqual(tokenHolderBalanceAfter, parseInt(tokenHolderBalanceBefore) - BURN_AMOUNT)
  })

  it('Non `ADMIN` cannot burn tokens', async () => {
    const BURN_AMOUNT = Math.floor(TOKEN_AMOUNT / 2)
    assert(BURN_AMOUNT <= TOKEN_AMOUNT)
    await TOKEN_METHODS.mint(TOKEN_HOLDER, TOKEN_AMOUNT).send({ from: ADMIN, gas: GAS_LIMIT })
    const tokenHolderBalanceBefore = await getTokenBalance(TOKEN_HOLDER, TOKEN_METHODS)
    assert.strictEqual(tokenHolderBalanceBefore, TOKEN_AMOUNT)
    await expectRevert(
      TOKEN_METHODS.burn(TOKEN_HOLDER, BURN_AMOUNT).send({ from: NON_ADMIN, gas: GAS_LIMIT }),
      'Only `ADMIN` can call this function!',
    )
    const tokenHolderBalanceAfter = await getTokenBalance(TOKEN_HOLDER, TOKEN_METHODS)
    assert.strictEqual(tokenHolderBalanceAfter, tokenHolderBalanceBefore)
  })
})
