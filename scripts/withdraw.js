const { getNamedAccounts, ethers } = require('hardhat')

async function main() {
    const { deployer } = await getNamedAccounts()
    const fundMe = await ethers.getContract('FundMe', deployer)
    console.log('Funding contract...')
    const withdrawResponse = await fundMe.withdraw()
    await withdrawResponse.wait(1)
    console.log('Withdrawed!')
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
