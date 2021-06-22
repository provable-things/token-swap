#  :arrows_counterclockwise: __`pLotto <-> Lotto`__ Token Swap Contract MVP

This repo demonstrates the simple method by which a given ERC777 __`pToken`__ may be swapped for a __`Lotto`__ token. This allows the __`Lotto`__ token to be bridged to other blockchains without changing the overall total supply. Using a swapping contract such as this decouples the __`pLotto`__ & __`Lotto`__ tokens entirely, allowing each to remain under the purview of their respective owners.

&nbsp;

## :arrow_right: Peg-In Details

 - There are __TWO__ ways a user can end up with __`Lotto`__ tokens on the destination chain:

 1) __Via a ONE step process:__ Using __`pTokens`__ metadata, the user can encode the destination address to which they want their destination-chain __`Lotto`__ tokens minted to. They then simply peg-in their origin-chain __`Lotto`__ tokens __TO THE `TOKEN_SWAP_CONTRACT`__, which contract then decodes the __`pTokens`__ metadata and mints the tokens to the desired address. To see this in action, inspect the following test:

 ```

// File: ./test/token-swap.test.js
  it('Should peg-in via a single transaction')

 ```

 2) __Via a TWO step process:__ The user uses the pToken bridge to move __`Lotto`__ tokens from the origin chain, result in them owning __`pLotto`__ tokens on the destination chain. They then send their __`pLotto`__ tokens to the __`TOKEN_SWAP`__ contract, resulting in their __`pLotto`__ tokens being swapped to __`Lotto`__ tokens on the destination chain. To see this in action, inspect the following test:

 ```

// File: ./test/token-swap.test.js
it('Should peg-in via two transactions')

 ```
&nbsp;

## :arrow_left: Peg-Out Details

 - There are __TWO__ ways a user can peg-out end up back with __`Lotto`__ tokens on the origin-chain:

 1) __Via a ONE step process:__ The user calls the __`redeemOriginChainLottoTokens`__ function in the __`Lotto`__ contract. This function first checks the caller has sufficient balance of the __`Lotto`__ token before calling __`redeemOriginChainLottoTokens`__ in the __`TOKEN_SWAP`__ contract. Which latter function can __only__ be called by the __`Lotto`__ contract, and which function first burns the __`_amount`__ of __`Lotto`__ tokens before calling __`redeem`__ on the `pLotto`__ contract for that same amount of tokens. This results in burning of those __`pLotto`__ tokens, and the emitting of the __`redeem`__ event. The __`pToken bridge`__ witness this event and completes the peg-out to the origin chain. To see this in action, inspect the following test:

 ```

// File: ./test/token-swap.test.js
  it('Should peg-out via a single transaction')

 ```

 2) __Via a TWO step process:__ The user uses the __`TOKEN_SWAP`__ contract to redeem an __`_amount`__ of __`pLotto`__ tokens, which process burns the equivalent amount of __`Lotto`__ tokens. The user can then call __`redeem`__ on the __`TOKEN_SWAP`__ contract for up to that same __`_amount`__ of tokens, which function will burn them and emit the __`redeem`__ event which the __`pToken brige`__ sees and acts upon to complete the peg-out to the origin chain. To see this in action, inspect the following test:

 ```

// File: ./test/token-swap.test.js
it('Should peg-out via two transactions')

 ```
&nbsp;

## :clipboard: Notes:

- Notice how the __`./contracts/ILOTTO.sol`__ interface shows the minimum set of methods the __`Lotto`__ contract would need to implement in order to work with the __`TOKEN_SWAP`__ contract. A sample implementation can be seen in __`./contracts/LOTTO.sol`__.

- The __`./contracts/PTOKEN.sol`__ contract is a trimmed down & non-upgradeable facsimile of the actual __`pToken`__ implementation [that can be seen here](https://github.com/provable-things/ptokens-erc777-smart-contract).

&nbsp;

## :guardsman: Smart-Contract Tests:

1) Clone & enter the repo:

```
❍  https://github.com/provable-things/token-swap.git && cd token-swap
```

2) Install dependencies:

```
❍ npm install
```

3) Start truffle via:

```
❍ npx truffle develop
```

4) Run the tests via:

```
❍ truffle_develop> test
```

Test output:

```

  Contract: TOKEN_SWAP
    Administrative tests:
      ✓ `OWNER_ADDRESS` can set Lotto contract (1609ms)
      ✓ `NON_OWNER_ADDRESS` cannot set Lotto contract (1482ms)
      ✓ `OWNER_ADDRESS` can set pLotto contract (1403ms)
      ✓ `NON_OWNER_ADDRESS` cannot set pLotto contract (1312ms)
      ✓ `OWNER_ADDRESS` can renounce ownership (2263ms)
      ✓ `NON_OWNER_ADDRESS` cannot renounce ownership (1882ms)
      ✓ Non `LOTTO_ADDRESS` cannot call `redeemOriginChainLotto` function (266ms)
    Token swapping tests:
      ONE-STEP peg-in/peg-out tests:
        ✓ Should peg-in via a single transaction (1649ms)
        ✓ Should peg-out via a single transaction: (2889ms)
      TWO-STEP peg-in/peg-out tests:
        ✓ Should peg-in via two transactions (1883ms)
        ✓ Should peg out via two transactions (830ms)
      Misc token-swapping tests:
        ✓ Sending ERC777 tokens other than `pLOTTO` to the `TOKEN_SWAP` contract should revert (464ms)
        ✓ Redeeming `pLotto` tokens will burn `Lotto` tokens (518ms)

  13 passing (1m)

```

&nbsp;


## :clipboard: To Do:

- [ ]

&nbsp;
