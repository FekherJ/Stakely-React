// test/ERC20Mock-deployment-test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20Mock Deployment Test", function () {
    it("Should deploy ERC20Mock successfully", async function () {
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        const testToken = await ERC20Mock.deploy("Test Token", "TST");
        await testToken.waitForDeployment();
        const testTokenAddress = await testToken.getAddress();
        console.log("ERC20Mock deployed at:", testTokenAddress);
        expect(testTokenAddress).to.not.be.undefined;
    });
});