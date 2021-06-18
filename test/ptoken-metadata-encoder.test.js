const assert = require('assert')
const { encodePTokenMetadata } = require('./ptoken-metadata-encoder')

contract('PToken Metadata Encode Test', ([ OWNER_ADDRESS, NON_OWNER_ADDRESS, USER_ADDRESS ]) => {
  it('PToken metadata encoder should work correctly', () => {
    const version = '0x01'
    const userData = '0xc0ffee'
    const metadataChainId = '0x005fe7f9'
    const originAddress = '0x5a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c'
    const expectedResult = '0x01000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080005fe7f9000000000000000000000000000000000000000000000000000000000000000000000000000000005a0b54d5dc17e0aadc383d2db43b0a0d3e029c4c0000000000000000000000000000000000000000000000000000000000000003c0ffee0000000000000000000000000000000000000000000000000000000000'
    const result = encodePTokenMetadata(web3, version, userData, metadataChainId, originAddress)
    assert.strictEqual(result, expectedResult)
  })
})
