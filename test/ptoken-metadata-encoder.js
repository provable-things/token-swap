// NOTE: See Core metadata format here:
// https://github.com/provable-things/ptokens-core-private/blob/f2f7a680f36408c1ccdf04db77b5d89aeea80dfd/src/metadata/mod.rs#L21
module.exports.encodePTokenMetadata = (_web3, _metadataVersion, _userData, _protocolId, _originAddress) =>
  _web3.eth.abi.encodeParameters(
    ['bytes1', 'bytes', 'bytes4', 'address'],
    [_metadataVersion, _userData, _protocolId, _originAddress]
  )
