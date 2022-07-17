const { assert, expect } = require('chai')
const { deployments, getNamedAccounts, ethers } = require('hardhat')

/* Test for the entire Contract */
describe('FundMe', async () => {
    let fundMe
    let deployer
    let mockV3Aggregator
    const sendValue = ethers.utils.parseEther('1') // 1 ETH

    beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(['all'])
        fundMe = await ethers.getContract('FundMe', deployer)
        mockV3Aggregator = await ethers.getContract(
            'MockV3Aggregator',
            deployer
        )
    })

    /* Unit Testing */
    describe('Constructor', async () => {
        it('Sets the aggregator addresses correctly', async () => {
            const response = await fundMe.getPriceFeed()

            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe('Fund', async () => {
        it('Should fail for not enough ETH', async () => {
            await expect(fundMe.fund()).to.be.revertedWith(
                'You need to spend more ETH!'
            )
        })

        it('Should update the amount sended by the funder address and push the address to the funders array', async () => {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getAddressToAmountFunded(deployer)
            const funder = await fundMe.getFunder(0)

            assert.equal(funder, deployer)
            assert.equal(response.toString(), sendValue.toString())
        })
    })

    describe('Withdraw', async () => {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue })
        })

        it('Should withdraw ETH from a single funder', async () => {
            /* Getting the starting balance from the contract and the contract deployer */
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            /* Withdrawing the money from the contract */
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            /* Getting the gas cost from the transaction */
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            /* Getting the ending balance */
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            /* Testing */
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
        })

        it('Should withdraw ETH from a single funder but using cheaperWithdraw', async () => {
            /* Getting the starting balance from the contract and the contract deployer */
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            /* Withdrawing the money from the contract */
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            /* Getting the gas cost from the transaction */
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            /* Getting the ending balance */
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            /* Testing */
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
        })

        it('Should allow us to withdraw with multiple funders', async () => {
            /* Getting some fake funders and funding with them accounts */
            const accounts = await ethers.getSigners()
            for (let i = 0; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectedContract.fund({ value: sendValue })
            }
            /* Getting the starting balance from the contract and the contract deployer */
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            /* Withdrawing the money from the contract */
            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            /* Getting the gas cost from the transaction */
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            /* Getting the ending balance */
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            /* testing */
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
            /* Make sure that the funders array reset properly */
            await expect(fundMe.getFunder(0)).to.be.reverted
            for (let i = 0; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })

        it('Should allow us to withdraw with multiple funders but using cheaperWithdraw', async () => {
            /* Getting some fake funders and funding with them accounts */
            const accounts = await ethers.getSigners()
            for (let i = 0; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectedContract.fund({ value: sendValue })
            }
            /* Getting the starting balance from the contract and the contract deployer */
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            /* Withdrawing the money from the contract */
            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)
            /* Getting the gas cost from the transaction */
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)
            /* Getting the ending balance */
            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )
            /* testing */
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
            /* Make sure that the funders array reset properly */
            await expect(fundMe.getFunder(0)).to.be.reverted
            for (let i = 0; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })

        it('Should only the owner be allowed to withdraw', async () => {
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const connectAttackerToContract = await fundMe.connect(attacker)
            await expect(
                connectAttackerToContract.withdraw()
            ).to.be.revertedWithCustomError(fundMe, 'FundMe__NotOwner')
        })
    })
})
