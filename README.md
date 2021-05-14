#  :arrows_counterclockwise: __`pLotto <-> Lotto`__ Token Swap Contract MVP

This repo demonstrates the simple method by which a given ERC777 __`pToken`__ may be swapped for a __`Lotto`__ token. This allows the __`Lotto`__ token to be bridged to other blockchains without changing the overall total supply. Using a swapping contract such as this decouples the __`pLotto`__ & __`Lotto`__ tokens entirely, allowing each to remain under the purview of their respective owners.

&nbsp;

## :mag: Peg-In Details

 - There are __TWO__ ways a user can end up with __`Lotto`__ tokens on the destination chain:

 1) __Via a TWO step process:__ The user uses the pToken bridge to move __`Lotto`__ tokens from the origin chain, result in them owning __`pLotto`__ tokens on the destination chain. They then send their __`pLotto`__ tokens to the __`TOKEN_SWAP`__ contract, resulting in their __`pLotto`__ tokens being swapped to __`Lotto`__ tokens on the destination chain. See the following test for an example of this

 ```

// File: ./test/token-swap.test.js
it('Sending `pLOTTO` tokens to `TOKEN_SWAP contract should mint `Lotto` tokens`')

 ```

 2) __Via a ONE step process:__ Using __`pTokens`__ metadata, the user can encode the destination address to which they want their destination-chain __`Lotto`__ tokens minted to. They then simply peg-in their origin-chain __`Lotto`__ tokens __TO THE `TOKEN_SWAP_CONTRACT`__, which contract then decodes the __`pTokens`__ metadata and mints the tokens to the desired address. For an example of this, please see the test:

 ```

// File: ./test/token-swap.test.js
  it('pLotto minted by the Provable bridge with the correct metadata will mint Lotto tokes in one tx')

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

  Contract: LOTTO
    ✓ `ADMIN` can mint tokens (291ms)
    ✓ Non `ADMIN` cannot mint (123ms)
    ✓ `ADMIN` can burn tokens (497ms)
    ✓ Non `ADMIN` cannot burn tokens (299ms)

  Contract: PTOKEN
    ✓ `MINTER` can mint tokens (330ms)
    ✓ `NON_MINTER` cannot mint (203ms)

  Contract: TOKEN_SWAP
    ✓ Sending `pLOTTO` tokens to `TOKEN_SWAP contract should mint `Lotto` tokens` (824ms)
    ✓ Sending ERC777 tokens other than `pLOTTO` to the `TOKEN_SWAP` contract should revert (626ms)
    ✓ Redeeming `pLotto` tokens will burn `Lotto` tokens (1002ms)
    ✓ pLotto minted with the correct metadata will mint Lotto tokes in one tx (871ms)

  9 passing (14s)

```

&nbsp;


## :clipboard: To Do:

- [ ]

&nbsp;
