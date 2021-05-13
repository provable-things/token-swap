module.exports.getTokenBalance = (_address, _contractMethods) =>
  _contractMethods.balanceOf(_address).call().then(parseInt)

module.exports.getContract = (_web3, _artifact, _constructorParams = []) =>
  new Promise((resolve, reject) =>
    _artifact
      .new(..._constructorParams)
      .then(({ contract: { _jsonInterface, _address } }) => resolve(new _web3.eth.Contract(_jsonInterface, _address)))
      .catch(reject)
  )
