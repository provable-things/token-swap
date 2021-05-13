const {
  getContract,
  getTokenBalance,
  mintTokensTo,
} = require('./test-utils')
const assert = require('assert')
const { prop } = require('ramda')
const { expectRevert } = require('@openzeppelin/test-helpers')
const TOKEN_SWAP_ARTIFACT = artifacts.require('TOKEN_SWAP.sol')
const PTOKEN_SIMPLE_ARTIFACT = artifacts.require('PTOKEN_SIMPLE.sol')
const ERC20_MINTABLE_ARTIFACT = artifacts.require('ERC20_MINTABLE.sol')

contract('TOKEN_SWAP', ([ OWNER, TOKEN_HOLDER ]) => {
  let PLOTTO_METHODS, LOTTO_METHODS, TOKEN_SWAP_METHODS, PLOTTO_ADDRESS, LOTTO_ADDRESS, TOKEN_SWAP_ADDRESS

  const GAS_LIMIT = 3e6
  const EMPTY_DATA = '0x'
  const TOKEN_AMOUNT = 1337

  beforeEach(async () => {
    const LOTTO_CONTRACT = await getContract(web3, ERC20_MINTABLE_ARTIFACT)
    LOTTO_METHODS = prop('methods', LOTTO_CONTRACT)
    LOTTO_ADDRESS = prop('_address', LOTTO_CONTRACT)

    const PLOTTO_CONTRACT = await getContract(web3, PTOKEN_SIMPLE_ARTIFACT)
    PLOTTO_METHODS = prop('methods', PLOTTO_CONTRACT)
    PLOTTO_ADDRESS = prop('_address', PLOTTO_CONTRACT)

    const TOKEN_SWAP_CONTRACT = await getContract(web3, TOKEN_SWAP_ARTIFACT, [ LOTTO_ADDRESS, PLOTTO_ADDRESS ])
    TOKEN_SWAP_METHODS = prop('methods', TOKEN_SWAP_CONTRACT)
    TOKEN_SWAP_ADDRESS = prop('_address', TOKEN_SWAP_CONTRACT)

    await LOTTO_METHODS.setAdmin(TOKEN_SWAP_ADDRESS).send({ from: OWNER })
  })

  it('Sending pLOTTO tokens to `TOKEN_SWAP contract should mint `Lotto` tokens`', async () => {
    const lottoBalanceBefore = await getTokenBalance(TOKEN_HOLDER, LOTTO_METHODS)
    assert.strictEqual(lottoBalanceBefore, 0)
    await mintTokensTo(PLOTTO_METHODS, OWNER, TOKEN_HOLDER, TOKEN_AMOUNT)
    await PLOTTO_METHODS.send(TOKEN_SWAP_ADDRESS, TOKEN_AMOUNT, EMPTY_DATA).send({ from: TOKEN_HOLDER, gas: GAS_LIMIT })
    const lottoBalanceAfter = await getTokenBalance(TOKEN_HOLDER, LOTTO_METHODS)
    assert.strictEqual(lottoBalanceAfter, TOKEN_AMOUNT)
  })

  it('Sending ERC777 tokens other than `PLOTTO` to the `TOKEN_SWAP` contract should revert', async () => {
    const ERC777_CONTRACT = await getContract(web3, PTOKEN_SIMPLE_ARTIFACT)
    const ERC777_METHODS = prop('methods', ERC777_CONTRACT)
    const ERC777_ADDRESS = prop('_address', ERC777_CONTRACT)
    assert.notStrictEqual(ERC777_ADDRESS, PLOTTO_ADDRESS)
    await mintTokensTo(ERC777_METHODS, OWNER, TOKEN_HOLDER, TOKEN_AMOUNT)
    await expectRevert(
      ERC777_METHODS.send(TOKEN_SWAP_ADDRESS, TOKEN_AMOUNT, EMPTY_DATA).send({ from: TOKEN_HOLDER, gas: GAS_LIMIT }),
      'This contract only accepts pLotto tokens!',
    )
  })
})
