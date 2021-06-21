const {
  getContract,
  mintTokensTo,
  getTokenBalance,
  getRandomEthAddress,
} = require('./test-utils')
const assert = require('assert')
const { prop } = require('ramda')
const { expectRevert } = require('@openzeppelin/test-helpers')
const TOKEN_SWAP_ARTIFACT = artifacts.require('TOKEN_SWAP.sol')
const LOTTO_ARTIFACT = artifacts.require('LOTTO.sol')
const PTOKEN_ARTIFACT = artifacts.require('PTOKEN.sol')
const { encodePTokenMetadata } = require('./ptoken-metadata-encoder')

contract('TOKEN_SWAP', ([ OWNER_ADDRESS, NON_OWNER_ADDRESS, USER_ADDRESS ]) => {
  let getUserLottoBalance, getUserPLottoBalance, getTokenSwapContractPLottoBalance
  let PLOTTO_CONTRACT, PLOTTO_METHODS, LOTTO_METHODS, TOKEN_SWAP_METHODS, PLOTTO_ADDRESS, LOTTO_ADDRESS, TOKEN_SWAP_ADDRESS

  const GAS_LIMIT = 3e6
  const EMPTY_DATA = '0x'
  const TOKEN_AMOUNT = 1337
  const REDEEM_EVENT_NAME = 'Redeem'
  const ONLY_OWNER_ERR = 'Only the owner can call this function!'
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

  beforeEach(async () => {
    // Deploy contracts and save relevant details as variables...
    PLOTTO_CONTRACT = await getContract(web3, PTOKEN_ARTIFACT)
    PLOTTO_METHODS = prop('methods', PLOTTO_CONTRACT)
    PLOTTO_ADDRESS = prop('_address', PLOTTO_CONTRACT)

    const TOKEN_SWAP_CONTRACT = await getContract(web3, TOKEN_SWAP_ARTIFACT)
    TOKEN_SWAP_METHODS = prop('methods', TOKEN_SWAP_CONTRACT)
    TOKEN_SWAP_ADDRESS = prop('_address', TOKEN_SWAP_CONTRACT)

    const LOTTO_CONTRACT = await getContract(web3, LOTTO_ARTIFACT, [ TOKEN_SWAP_ADDRESS ])
    LOTTO_METHODS = prop('methods', LOTTO_CONTRACT)
    LOTTO_ADDRESS = prop('_address', LOTTO_CONTRACT)

    // Set the correct contract addresses in the token-swap contract..
    await TOKEN_SWAP_METHODS.setLottoContract(LOTTO_ADDRESS).send({ from: OWNER_ADDRESS, gas: GAS_LIMIT })
    await TOKEN_SWAP_METHODS.setPLottoContract(PLOTTO_ADDRESS).send({ from: OWNER_ADDRESS, gas: GAS_LIMIT })

    // Renounce ownership since we no longer need a contract admin...
    await TOKEN_SWAP_METHODS.renounceOwnership().send({ from: OWNER_ADDRESS, gas: GAS_LIMIT })

    // Define some helper fxns...
    getUserLottoBalance = _ => getTokenBalance(USER_ADDRESS, LOTTO_METHODS)
    getUserPLottoBalance = _ => getTokenBalance(USER_ADDRESS, PLOTTO_METHODS)
    getTokenSwapContractPLottoBalance = _ => getTokenBalance(TOKEN_SWAP_ADDRESS, PLOTTO_METHODS)
  })

  describe('Administrative tests:', () => {
    it('`OWNER_ADDRESS` can set Lotto contract', async () => {
      const NEW_TOKEN_SWAP_CONTRACT = await getContract(web3, TOKEN_SWAP_ARTIFACT)
      const NEW_LOTTO_CONTRACT_ADDRESS = getRandomEthAddress(web3)
      assert.strictEqual(await NEW_TOKEN_SWAP_CONTRACT.methods.LOTTO_ADDRESS().call(), ZERO_ADDRESS)
      await NEW_TOKEN_SWAP_CONTRACT
        .methods
        .setLottoContract(NEW_LOTTO_CONTRACT_ADDRESS)
        .send({ from: OWNER_ADDRESS, gas: GAS_LIMIT })
      assert.strictEqual(await NEW_TOKEN_SWAP_CONTRACT.methods.LOTTO_ADDRESS().call(), NEW_LOTTO_CONTRACT_ADDRESS)
    })

    it('`NON_OWNER_ADDRESS` cannot set Lotto contract', async () => {
      const NEW_TOKEN_SWAP_CONTRACT = await getContract(web3, TOKEN_SWAP_ARTIFACT)
      const NEW_LOTTO_CONTRACT_ADDRESS = getRandomEthAddress(web3)
      assert.strictEqual(await NEW_TOKEN_SWAP_CONTRACT.methods.LOTTO_ADDRESS().call(), ZERO_ADDRESS)
      await expectRevert(
        NEW_TOKEN_SWAP_CONTRACT
          .methods
          .setLottoContract(NEW_LOTTO_CONTRACT_ADDRESS)
          .send({ from: NON_OWNER_ADDRESS, gas: GAS_LIMIT }),
        ONLY_OWNER_ERR,
      )
      assert.strictEqual(await NEW_TOKEN_SWAP_CONTRACT.methods.LOTTO_ADDRESS().call(), ZERO_ADDRESS)
    })

    it('`OWNER_ADDRESS` can set pLotto contract', async () => {
      const NEW_TOKEN_SWAP_CONTRACT = await getContract(web3, TOKEN_SWAP_ARTIFACT)
      const NEW_PLOTTO_CONTRACT_ADDRESS = getRandomEthAddress(web3)
      assert.strictEqual(await NEW_TOKEN_SWAP_CONTRACT.methods.PLOTTO_ADDRESS().call(), ZERO_ADDRESS)
      await NEW_TOKEN_SWAP_CONTRACT
        .methods
        .setPLottoContract(NEW_PLOTTO_CONTRACT_ADDRESS)
        .send({ from: OWNER_ADDRESS, gas: GAS_LIMIT })
      assert.strictEqual(await NEW_TOKEN_SWAP_CONTRACT.methods.PLOTTO_ADDRESS().call(), NEW_PLOTTO_CONTRACT_ADDRESS)
    })

    it('`NON_OWNER_ADDRESS` cannot set pLotto contract', async () => {
      const NEW_TOKEN_SWAP_CONTRACT = await getContract(web3, TOKEN_SWAP_ARTIFACT)
      const NEW_PLOTTO_CONTRACT_ADDRESS = getRandomEthAddress(web3)
      assert.strictEqual(await NEW_TOKEN_SWAP_CONTRACT.methods.PLOTTO_ADDRESS().call(), ZERO_ADDRESS)
      await expectRevert(
        NEW_TOKEN_SWAP_CONTRACT
          .methods
          .setPLottoContract(NEW_PLOTTO_CONTRACT_ADDRESS)
          .send({ from: NON_OWNER_ADDRESS, gas: GAS_LIMIT }),
        ONLY_OWNER_ERR
      )
      assert.strictEqual(await NEW_TOKEN_SWAP_CONTRACT.methods.PLOTTO_ADDRESS().call(), ZERO_ADDRESS)
    })

    it('`OWNER_ADDRESS` can renounce ownership', async () => {
      const NEW_TOKEN_SWAP_CONTRACT = await getContract(web3, TOKEN_SWAP_ARTIFACT)
      assert.strictEqual(await NEW_TOKEN_SWAP_CONTRACT.methods.OWNER().call(), OWNER_ADDRESS)
      await NEW_TOKEN_SWAP_CONTRACT.methods.renounceOwnership().send({ from: OWNER_ADDRESS, gas: GAS_LIMIT })
      assert.strictEqual(await NEW_TOKEN_SWAP_CONTRACT.methods.OWNER().call(), ZERO_ADDRESS)
    })

    it('`NON_OWNER_ADDRESS` cannot renounce ownership', async () => {
      const NEW_TOKEN_SWAP_CONTRACT = await getContract(web3, TOKEN_SWAP_ARTIFACT)
      assert.strictEqual(await NEW_TOKEN_SWAP_CONTRACT.methods.OWNER().call(), OWNER_ADDRESS)
      await expectRevert(
        NEW_TOKEN_SWAP_CONTRACT.methods.renounceOwnership().send({ from: NON_OWNER_ADDRESS, gas: GAS_LIMIT }),
        ONLY_OWNER_ERR,
      )
      assert.strictEqual(await NEW_TOKEN_SWAP_CONTRACT.methods.OWNER().call(), OWNER_ADDRESS)
    })

    it('Non `LOTTO_ADDRESS` cannot call `redeemOriginChainLotto` function', async () => {
      const NON_LOTTO_ADDRESS = OWNER_ADDRESS
      assert.notStrictEqual(NON_LOTTO_ADDRESS, LOTTO_ADDRESS)
      const IRRELEVANT_FUNCTION_PARAMS = [TOKEN_AMOUNT, getRandomEthAddress(web3), EMPTY_DATA, `${ZERO_ADDRESS}`]
      await expectRevert(
        TOKEN_SWAP_METHODS
          .redeemOriginChainLottoTokens(...IRRELEVANT_FUNCTION_PARAMS)
          .send({ from: NON_LOTTO_ADDRESS, gas: GAS_LIMIT }),
        'Only Lotto contract address can call this function!',
      )
    })
  })

  describe('Token swapping tests:', () => {
    // This user doesn't drink caffeine...
    const USER_DATA = '0xdecaff'
    // Create random address for user to peg-out to...
    const DESTINATION_ADDRESS = `${getRandomEthAddress(web3)}`

    describe('ONE-STEP peg-in/peg-out tests:', () => {
      const getPTokenMetadataWithUserDestinationAddress = _web3 => {
        // Dummy values to create `pTokenMetadata` with...
        const PTOKEN_METADATA_DUMMY_METADATA_VERSION = '0x01'
        const PTOKEN_METADATA_DUMMY_PROTOCOL_ID = '0x005fe7f9'
        const PTOKEN_METADATA_DUMMY_ORIGIN_ADDRESS = '0x7eef81767e36269db39ffa6271cc4325cbc59cfe'
        return encodePTokenMetadata(
          web3,
          PTOKEN_METADATA_DUMMY_METADATA_VERSION,
          USER_ADDRESS,
          PTOKEN_METADATA_DUMMY_PROTOCOL_ID,
          PTOKEN_METADATA_DUMMY_ORIGIN_ADDRESS,
        )
      }

      it('Should peg-in via a single transaction', async () => {
        // Assert zero balances before...
        assert.strictEqual(await getUserLottoBalance(), 0)
        assert.strictEqual(await getUserPLottoBalance(), 0)
        assert.strictEqual(await getTokenSwapContractPLottoBalance(), 0)

        // User crosses ptoken bridge, setting their destination address as the `TOKEN_SWAP_ADDRESS` directly. The
        // address the user wants to hold their destination-chain `Lotto` tokens is encoded in the metadata.
        // NOTE that this function is called by the pToken bridge itself, hence the `OWNER_ADDRESS`.
        await PLOTTO_METHODS['mint(address,uint256,bytes,bytes)'](
          TOKEN_SWAP_ADDRESS,
          TOKEN_AMOUNT,
          getPTokenMetadataWithUserDestinationAddress(web3),
          EMPTY_DATA, // NOTE: Unused ERC777-specific param: `operatorData`
        ).send({ from: OWNER_ADDRESS, gas: GAS_LIMIT })

        // Assert balances after...
        assert.strictEqual(await getUserPLottoBalance(), 0)
        assert.strictEqual(await getUserLottoBalance(), TOKEN_AMOUNT)
        assert.strictEqual(await getTokenSwapContractPLottoBalance(), TOKEN_AMOUNT)
      })

      it('Should peg-out via a single transaction:', async () => {
        // User pegs-in via same one-step method as the preceding test...
        await PLOTTO_METHODS['mint(address,uint256,bytes,bytes)'](
          TOKEN_SWAP_ADDRESS,
          TOKEN_AMOUNT,
          getPTokenMetadataWithUserDestinationAddress(web3),
          EMPTY_DATA, // NOTE: Unused ERC777-specific param: `operatorData`
        ).send({ from: OWNER_ADDRESS, gas: GAS_LIMIT })

        // Assert balances after peg-in...
        assert.strictEqual(await getUserPLottoBalance(), 0)
        assert.strictEqual(await getUserLottoBalance(), TOKEN_AMOUNT)
        assert.strictEqual(await getTokenSwapContractPLottoBalance(), TOKEN_AMOUNT)

        // User pegs-out via the `LOTTO_CONTRACT` function...
        await LOTTO_METHODS['redeemOriginChainLottoTokens(uint256,string,bytes)'](
          TOKEN_AMOUNT,
          DESTINATION_ADDRESS,
          USER_DATA
        ).send({ from: USER_ADDRESS, gas: GAS_LIMIT })

        // Assert zero balances after peg-out...
        assert.strictEqual(await getUserPLottoBalance(), 0)
        assert.strictEqual(await getUserLottoBalance(), 0)
        assert.strictEqual(await getTokenSwapContractPLottoBalance(), 0)

        // Assert the values in the redeem event fired from the `pLotto` contract.
        const redeemEvents = await PLOTTO_CONTRACT.getPastEvents(REDEEM_EVENT_NAME)
        assert.strictEqual(redeemEvents.length, 1)
        const eventData = redeemEvents[0].returnValues
        assert.strictEqual(eventData.userData, USER_DATA)
        assert.strictEqual(eventData.value, `${TOKEN_AMOUNT}`)
        assert.strictEqual(eventData.redeemer, `${TOKEN_SWAP_ADDRESS}`)
        assert.strictEqual(eventData._underlyingAssetRecipient, DESTINATION_ADDRESS)

        // The pToken bridge takes over from here having seen the `redeem` event. The bridge completes the peg-out
        // to the origin-chain.
      })
    })

    describe('TWO-STEP peg-in/peg-out tests:', () => {
      it('Should peg-in via two transactions', async () => {
        // Assert zero balances...
        assert.strictEqual(await getUserLottoBalance(), 0)
        assert.strictEqual(await getUserPLottoBalance(), 0)
        assert.strictEqual(await getTokenSwapContractPLottoBalance(), 0)

        // User crosses the pToken bridge with mints destination-chain `pLotto` tokens to them...
        await mintTokensTo(PLOTTO_METHODS, OWNER_ADDRESS, USER_ADDRESS, TOKEN_AMOUNT)

        // Assert correct balances after pLotto mint...
        assert.strictEqual(await getUserLottoBalance(), 0)
        assert.strictEqual(await getUserPLottoBalance(), TOKEN_AMOUNT)
        assert.strictEqual(await getTokenSwapContractPLottoBalance(), 0)

        // User sends their `pLotto` tokens to the `TOKEN_SWAP_CONTRACT` get their destination-chain `Lotto` tokens...
        await PLOTTO_METHODS
          .send(TOKEN_SWAP_ADDRESS, TOKEN_AMOUNT, EMPTY_DATA)
          .send({ from: USER_ADDRESS, gas: GAS_LIMIT })

        // Assert final balances...
        assert.strictEqual(await getUserPLottoBalance(), 0)
        assert.strictEqual(await getUserLottoBalance(), TOKEN_AMOUNT)
        assert.strictEqual(await getTokenSwapContractPLottoBalance(), TOKEN_AMOUNT)
      })

      it('Should peg out via two transactions', async () => {
        // User pegs-in via the two step process in the preceding test...
        await mintTokensTo(PLOTTO_METHODS, OWNER_ADDRESS, USER_ADDRESS, TOKEN_AMOUNT)
        await PLOTTO_METHODS
          .send(TOKEN_SWAP_ADDRESS, TOKEN_AMOUNT, EMPTY_DATA)
          .send({ from: USER_ADDRESS, gas: GAS_LIMIT })

        // Assert balances after pegging in...
        assert.strictEqual(await getUserPLottoBalance(), 0)
        assert.strictEqual(await getUserLottoBalance(), TOKEN_AMOUNT)
        assert.strictEqual(await getTokenSwapContractPLottoBalance(), TOKEN_AMOUNT)

        // User then converts their `Lotto` tokens back to `pLotto` tokens...
        await TOKEN_SWAP_METHODS.redeemPLotto(TOKEN_AMOUNT).send({ from: USER_ADDRESS, gas: GAS_LIMIT })

        // Assert balances after user has convert their `Lotto` to `pLotto`...
        assert.strictEqual(await getUserPLottoBalance(), TOKEN_AMOUNT)
        assert.strictEqual(await getUserLottoBalance(), 0)
        assert.strictEqual(await getTokenSwapContractPLottoBalance(), 0)

        // User then redeems the `pLotto` tokens to origin-chain `Lotto` tokens via the `pLotto` contract...
        await PLOTTO_METHODS['redeem(uint256,bytes,string)'](
          TOKEN_AMOUNT,
          USER_DATA,
          DESTINATION_ADDRESS,
        ).send({ from: USER_ADDRESS, gas: GAS_LIMIT })

        // Assert zero balances after peg-out...
        assert.strictEqual(await getUserPLottoBalance(), 0)
        assert.strictEqual(await getUserLottoBalance(), 0)
        assert.strictEqual(await getTokenSwapContractPLottoBalance(), 0)

        // Assert the values in the redeem event fired from the `pLotto` contract.
        const redeemEvents = await PLOTTO_CONTRACT.getPastEvents(REDEEM_EVENT_NAME)
        assert.strictEqual(redeemEvents.length, 1)
        const eventData = redeemEvents[0].returnValues
        assert.strictEqual(eventData.userData, USER_DATA)
        assert.strictEqual(eventData.value, `${TOKEN_AMOUNT}`)
        assert.strictEqual(eventData.redeemer, `${USER_ADDRESS}`)
        assert.strictEqual(eventData._underlyingAssetRecipient, DESTINATION_ADDRESS)

        // The pToken bridge takes over from here having seen the `redeem` event. The bridge completes the peg-out
        // to the origin-chain.
      })
    })

    describe('Misc token-swapping tests:', () => {
      it('Sending ERC777 tokens other than `pLOTTO` to the `TOKEN_SWAP` contract should revert', async () => {
        const ERC777_CONTRACT = await getContract(web3, PTOKEN_ARTIFACT)
        const ERC777_METHODS = prop('methods', ERC777_CONTRACT)
        const ERC777_ADDRESS = prop('_address', ERC777_CONTRACT)
        assert.notStrictEqual(ERC777_ADDRESS, PLOTTO_ADDRESS)
        await mintTokensTo(ERC777_METHODS, OWNER_ADDRESS, USER_ADDRESS, TOKEN_AMOUNT)
        await expectRevert(
          ERC777_METHODS
            .send(TOKEN_SWAP_ADDRESS, TOKEN_AMOUNT, EMPTY_DATA)
            .send({ from: USER_ADDRESS, gas: GAS_LIMIT }),
          'This contract only accepts pLotto tokens!',
        )
      })

      it('Redeeming `pLotto` tokens will burn `Lotto` tokens', async () => {
        const REDEEM_AMOUNT = Math.floor(TOKEN_AMOUNT / 2)
        await mintTokensTo(PLOTTO_METHODS, OWNER_ADDRESS, USER_ADDRESS, TOKEN_AMOUNT)
        await PLOTTO_METHODS
          .send(TOKEN_SWAP_ADDRESS, TOKEN_AMOUNT, EMPTY_DATA)
          .send({ from: USER_ADDRESS, gas: GAS_LIMIT })
        const userLottoBalanceBefore = await getUserLottoBalance()
        assert.strictEqual(userLottoBalanceBefore, TOKEN_AMOUNT)
        assert.strictEqual(await getUserPLottoBalance(), 0)
        await TOKEN_SWAP_METHODS.redeemPLotto(REDEEM_AMOUNT).send({ from: USER_ADDRESS, gas: GAS_LIMIT })
        assert.strictEqual(await getUserLottoBalance(), userLottoBalanceBefore - REDEEM_AMOUNT)
        assert.strictEqual(await getUserPLottoBalance(), REDEEM_AMOUNT)
      })
    })
  })
})
