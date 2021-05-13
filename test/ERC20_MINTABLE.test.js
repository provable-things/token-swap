const {
  getContract,
  checkObjHasKey,
  getTokenBalance,
} = require('./test-utils')
const assert = require('assert')
const { prop } = require('ramda')
const { expectRevert } = require('@openzeppelin/test-helpers')
const ERC20_MINTABLE_ARTIFACT = artifacts.require('ERC20_MINTABLE.sol')

const getAdminAddress = _methods => {
  const method = 'ADMIN'
  return checkObjHasKey(_methods, method).then(_ => _methods[method]().call())
}

contract('ERC20_MINTABLE', ([ OWNER, NON_ADMIN, TOKEN_RECIPIENT ]) => {
  let TOKEN_METHODS
  const GAS_LIMIT = 3e6
  const TOKEN_AMOUNT = 1337

  beforeEach(async () => {
    const TOKEN_CONTRACT = await getContract(web3, ERC20_MINTABLE_ARTIFACT)
    TOKEN_METHODS = prop('methods', TOKEN_CONTRACT)
  })

  it('`ADMIN` can mint tokens', async () => {
    const ADMIN = await getAdminAddress(TOKEN_METHODS)
    const recipienTokenBalanceBefore = await getTokenBalance(TOKEN_RECIPIENT, TOKEN_METHODS)
    assert.strictEqual(recipienTokenBalanceBefore, 0)
    await TOKEN_METHODS.mint(TOKEN_RECIPIENT, TOKEN_AMOUNT).send({ from: ADMIN, gas: GAS_LIMIT })
    const recipienTokenBalanceAfter = await getTokenBalance(TOKEN_RECIPIENT, TOKEN_METHODS)
    assert.strictEqual(recipienTokenBalanceAfter, TOKEN_AMOUNT)
  })

  it('Non `ADMIN` cannot mint', async () => {
    const ADMIN = await getAdminAddress(TOKEN_METHODS)
    assert.notStrictEqual(ADMIN, NON_ADMIN)
    await expectRevert(
      TOKEN_METHODS.mint(TOKEN_RECIPIENT, TOKEN_AMOUNT).send({ from: NON_ADMIN, gas: GAS_LIMIT }),
      'Only `ADMIN` can call this function!',
    )
  })
})
