# :page_with_curl: __`pLotto`__ <-> __`Lotto`__ Token Swap Contract MVP

This repo demonstrates the simple method by which a given ERC777 __`pToken`__ may be swapped for a __`Lotto`__ token. This allows the __`Lotto`__ token to be bridged to other blockchains without changing the overall total supply. Using a swapping contract such as this decouples the __`pLotto`__ & __`Lotto`__ tokens entirely, allowing each to remain under the purview of their respective owners.

&nbsp;

***

&nbsp;

### :clipboard: Notes

- Please see the __`./test/TOKEN_SWAP.test.js`__ file to see how the token swapping would work.

- Notice how the __`./contracts/IERC20_SIMPLE.sol`__ interface shows the minimum set of methods the __`Lotto`__ contract would need to implement in order to work with the __`TOKEN_SWAP`__ contract. A sample implementation can be seen in __`./contracts/ERC20_SIMPLE.sol`__.

- The __`./contracts/PTOKEN_SIMPLE.sol`__ contract is a trimmed down & non-upgradeable facsimile of the actual __`pToken`__ implementation __[that can be found here](https://github.com/provable-things/ptokens-erc777-smart-contract)__.

 - A simple mint made to the __`pLotto`__ token via the __`pToken`__ bridge would __not__ result in a token-swap to the final __`Lotto`__ token. The user would need to manually send the __`pLotto`__ to the swap contract in order to get their __`Lotto`__ tokens. However, __pToken__ bridges allow for the passing of metadata from one chain to another. Via this, & using __`ERC777`__ hooks, the cross chain peg-in of __`origin-chain-Lotto-token`__ -<ptoken-bridge>-> __`destination-chain-pLotto-token`__ -<token-swap-contract>-> __`destination-chain-Lotto-token`__ can be done in single transaction, which is a much better experience for the end user. An example of this can be seen in the test: <TODO: TEST_NAME_HERE>.

&nbsp;

***

&nbsp;

### :guardsman: Smart-Contract Tests:

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

  Contract: ERC20_SIMPLE
    ✓ `ADMIN` can mint tokens (291ms)
    ✓ Non `ADMIN` cannot mint (123ms)
    ✓ `ADMIN` can burn tokens (497ms)
    ✓ Non `ADMIN` cannot burn tokens (299ms)

  Contract: PTOKEN_SIMPLE
    ✓ `MINTER` can mint tokens (330ms)
    ✓ `NON_MINTER` cannot mint (203ms)

  Contract: TOKEN_SWAP
    ✓ Sending `pLOTTO` tokens to `TOKEN_SWAP contract should mint `Lotto` tokens` (824ms)
    ✓ Sending ERC777 tokens other than `pLOTTO` to the `TOKEN_SWAP` contract should revert (626ms)
    ✓ Redeeming `pLotto` tokens will burn `Lotto` tokens (1002ms)


  9 passing (14s)

```

&nbsp;

***

# :clipboard: To Do:

- [ ]

&nbsp;
