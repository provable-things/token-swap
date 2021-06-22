module.exports = {
  compilers: {
    solc: {
      version: '0.7.6',
      settings: {
        optimizer: {
          enabled: false,
          runs: 200
        },
      }
    }
  },
}
