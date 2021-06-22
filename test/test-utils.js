const { has } = require('ramda')

const checkObjHasKey = (_obj, _key) =>
  new Promise((resolve, reject) =>
    has(_key, _obj)
      ? resolve(_obj)
      : reject(new Error(`Obj does not have '${_key}' key!`))
  )

const getTokenBalance = (_recipient, _methods) =>
  new Promise((resolve, reject) => {
    const method = 'balanceOf'
    return !has(method, _methods)
      ? reject(new Error(`Cannot get balance: '${method}' method not supported!`))
      : _methods[method](_recipient)
        .call()
        .then(parseInt)
        .then(resolve)
        .catch(reject)
  })

const getContract = (_web3, _artifact, _constructorParams = []) =>
  new Promise((resolve, reject) =>
    _artifact
      .new(..._constructorParams)
      .then(({ contract: { _jsonInterface, _address } }) => resolve(new _web3.eth.Contract(_jsonInterface, _address)))
      .catch(reject)
  )

const mintTokensTo = (_methods, _minter, _recipient, _amount) => {
  const method = 'mint'
  return checkObjHasKey(_methods, method).then(_ => _methods[method](_recipient, _amount).send({ from: _minter }))
}

const getRandomEthAddress = _web3 =>
  _web3.utils.toChecksumAddress(_web3.utils.randomHex(20))

module.exports = {
  getRandomEthAddress,
  getTokenBalance,
  checkObjHasKey,
  mintTokensTo,
  getContract,
}
