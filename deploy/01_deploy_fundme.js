const { network } = require('hardhat')
const { networkConfig, developmentChains } = require('../helper-hardhat-config')
const { verify } = require('../utils/verify')
require('dotenv').config()

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    let ethUsdPriceFeedAddress

    if (developmentChains.includes(network.name)) {
        /*
            Getting address from the MockV3Aggregator contract and setting to the
            price feed variable 
        */
        const ethUsdAggregator = await get('MockV3Aggregator')
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdFeed']
    }

    const args = [ethUsdPriceFeedAddress]

    const fundMe = await deploy('FundMe', {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args)
    }
    log('<-------------------------------->!!!')
}

module.exports.tags = ['all', 'fundme']
