const PTOKEN_SIMPLE = artifacts.require('PTOKEN_SIMPLE')
const { singletons } = require('@openzeppelin/test-helpers')
require('@openzeppelin/test-helpers/configure')({ provider: web3.currentProvider, environment: 'truffle' })

module.exports = async (deployer, network, accounts) => {
  // NOTE: In a test environment an ERC777 token requires deploying an ERC1820 registry
  if (network.includes('develop')) await singletons.ERC1820Registry(accounts[0])

  await deployer.deploy(PTOKEN_SIMPLE)
}
