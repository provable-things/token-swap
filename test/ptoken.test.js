const {
  getContract,
  getTokenBalance,
} = require('./test-utils')
const assert = require('assert')
const { prop } = require('ramda')
const { expectRevert } = require('@openzeppelin/test-helpers')
const PTOKEN_ARTIFACT = artifacts.require('PTOKEN.sol')

contract('PTOKEN', ([ MINTER, NON_MINTER, TOKEN_RECIPIENT ]) => {
  let TOKEN_METHODS
  const GAS_LIMIT = 3e6
  const TOKEN_AMOUNT = 1337

  beforeEach(async () => {
    assert(MINTER !== NON_MINTER)
    const TOKEN_CONTRACT = await getContract(web3, PTOKEN_ARTIFACT)
    TOKEN_METHODS = prop('methods', TOKEN_CONTRACT)
  })

  it('`MINTER` can mint tokens', async () => {
    const recipienTokenBalanceBefore = await getTokenBalance(TOKEN_RECIPIENT, TOKEN_METHODS)
    assert.strictEqual(recipienTokenBalanceBefore, 0)
    await TOKEN_METHODS.mint(TOKEN_RECIPIENT, TOKEN_AMOUNT).send({ from: MINTER, gas: GAS_LIMIT })
    const recipienTokenBalanceAfter = await getTokenBalance(TOKEN_RECIPIENT, TOKEN_METHODS)
    assert.strictEqual(recipienTokenBalanceAfter, TOKEN_AMOUNT)
  })

  it('`NON_MINTER` cannot mint', async () => {
    await expectRevert(
      TOKEN_METHODS.mint(TOKEN_RECIPIENT, TOKEN_AMOUNT).send({ from: NON_MINTER, gas: GAS_LIMIT }),
      'Caller is not the minter',
    )
  })
})
