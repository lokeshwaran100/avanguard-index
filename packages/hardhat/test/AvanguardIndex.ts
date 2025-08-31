import { expect } from "chai";
import { ethers } from "hardhat";
import { AGIToken, MockOracle, FundFactory, Fund } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Avanguard Index", function () {
  let agiToken: AGIToken;
  let mockOracle: MockOracle;
  let fundFactory: FundFactory;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const fujiWavaxAddress = "0xd00ae08403B9bbb9124bB305C09058E32C39A48c";
  const fujiDexAddress = "0x2D99ABD9008Dc933ff5c0CD271B88309593aB921";

  beforeEach(async () => {
    const signers = await ethers.getSigners();
    owner = signers[0];
    user1 = signers[1];
    user2 = signers[2];

    // Deploy AGI Token
    const AGITokenFactory = await ethers.getContractFactory("AGIToken");
    agiToken = (await AGITokenFactory.deploy(owner.address)) as AGIToken;
    await agiToken.waitForDeployment();

    // Deploy Mock Oracle
    const MockOracleFactory = await ethers.getContractFactory("MockOracle");
    mockOracle = (await MockOracleFactory.deploy()) as MockOracle;
    await mockOracle.waitForDeployment();

    // Deploy Fund Factory
    const FundFactoryFactory = await ethers.getContractFactory("FundFactory");
    fundFactory = (await FundFactoryFactory.deploy(
      await agiToken.getAddress(),
      await mockOracle.getAddress(),
      owner.address,
      fujiDexAddress,
      fujiWavaxAddress,
      owner.address,
    )) as FundFactory;
    await fundFactory.waitForDeployment();

    // Transfer some AGI tokens to users for testing
    await agiToken.transfer(user1.address, ethers.parseEther("10000"));
    await agiToken.transfer(user2.address, ethers.parseEther("10000"));
  });

  describe("AGI Token", function () {
    it("Should have correct initial supply", async function () {
      const totalSupply = await agiToken.totalSupply();
      expect(totalSupply).to.equal(ethers.parseEther("1000000000")); // 1 billion tokens
    });

    it("Should allow burning tokens", async function () {
      const initialBalance = await agiToken.balanceOf(user1.address);
      const burnAmount = ethers.parseEther("100");

      await agiToken.connect(user1).burn(burnAmount);

      const finalBalance = await agiToken.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance - burnAmount);
    });
  });

  describe("Fund Factory", function () {
    it("Should create a new fund", async function () {
      const fundName = "Test Fund";
      const fundTicker = "TEST";
      const tokens = [
        "0xEa81F6972aDf76765Fd1435E119Acc0Aafc80BeA", // JOE
        "0xf4E0A9224e8827dE91050b528F34e2F99C82Fbf6", // UNI
      ];

      // Approve AGI tokens for fund creation
      await agiToken.connect(user1).approve(await fundFactory.getAddress(), ethers.parseEther("1000"));

      // Create fund
      await fundFactory.connect(user1).createFund(fundName, fundTicker, tokens);

      // Check if fund was created
      const fundCount = await fundFactory.getTotalFunds();
      expect(fundCount).to.equal(1);

      const [, name, ticker, underlyingTokens] = await fundFactory.getFund(0);
      expect(name).to.equal(fundName);
      expect(ticker).to.equal(fundTicker);
      expect(underlyingTokens).to.deep.equal(tokens);
    });

    it("Should require AGI tokens for fund creation", async function () {
      const fundName = "Test Fund";
      const fundTicker = "TEST";
      const tokens = ["0xEa81F6972aDf76765Fd1435E119Acc0Aafc80BeA"];

      // Try to create fund without approving AGI tokens
      await expect(fundFactory.connect(user2).createFund(fundName, fundTicker, tokens)).to.be.reverted;
    });
  });

  describe("Fund", function () {
    let testFund: Fund;

    beforeEach(async () => {
      // Set prices for the tokens used in this test suite
      await mockOracle.setTokenPrice("0xEa81F6972aDf76765Fd1435E119Acc0Aafc80BeA", 4 * 1e8); // JOE at $4
      await mockOracle.setTokenPrice("0xf4E0A9224e8827dE91050b528F34e2F99C82Fbf6", 5 * 1e8); // UNI at $5

      // Create a test fund
      const fundName = "Test Fund";
      const fundTicker = "TEST";
      const tokens = [
        "0xEa81F6972aDf76765Fd1435E119Acc0Aafc80BeA", // JOE
        "0xf4E0A9224e8827dE91050b528F34e2F99C82Fbf6", // UNI
      ];

      await agiToken.connect(user1).approve(await fundFactory.getAddress(), ethers.parseEther("1000"));
      await fundFactory.connect(user1).createFund(fundName, fundTicker, tokens);

      const [fundAddress] = await fundFactory.getFund(0);
      testFund = (await ethers.getContractAt("Fund", fundAddress)) as Fund;
    });

    it("Should allow buying fund tokens", async function () {
      const buyAmount = ethers.parseEther("1"); // 1 AVAX

      await testFund.connect(user2).buy({ value: buyAmount });

      const fundTokenBalance = await testFund.balanceOf(user2.address);
      expect(fundTokenBalance).to.be.gt(0);
    });

    it("Should allow selling fund tokens", async function () {
      // First buy some fund tokens
      const buyAmount = ethers.parseEther("1");
      await testFund.connect(user2).buy({ value: buyAmount });

      const fundTokenBalance = await testFund.balanceOf(user2.address);

      // Sell half of the fund tokens
      const sellAmount = fundTokenBalance / 2n;
      await testFund.connect(user2).sell(sellAmount);

      const newBalance = await testFund.balanceOf(user2.address);
      expect(newBalance).to.equal(fundTokenBalance - sellAmount);
    });

    it("Should calculate fund value correctly", async function () {
      const buyAmount = ethers.parseEther("1");
      await testFund.connect(user2).buy({ value: buyAmount });

      const fundValue = await testFund.getCurrentFundValue();
      expect(fundValue).to.be.gt(0);
    });

    it("Should track token balances correctly", async function () {
      const buyAmount = ethers.parseEther("1");
      await testFund.connect(user2).buy({ value: buyAmount });

      // Check token balances for each underlying token
      const usdcBalance = await testFund.getTokenBalance("0xEa81F6972aDf76765Fd1435E119Acc0Aafc80BeA");
      const usdtBalance = await testFund.getTokenBalance("0xf4E0A9224e8827dE91050b528F34e2F99C82Fbf6");

      expect(usdcBalance).to.be.gt(0);
      expect(usdtBalance).to.be.gt(0);
    });
  });

  describe("Oracle", function () {
    it("Should return correct token prices", async function () {
      const MockERC20Factory = await ethers.getContractFactory("MockERC20");
      const mockToken = await MockERC20Factory.deploy("Test", "TST", owner.address);
      await mockToken.waitForDeployment();
      await mockOracle.setTokenPrice(await mockToken.getAddress(), 12345);
      const price = await mockOracle.getPrice(await mockToken.getAddress());
      expect(price).to.equal(12345);
    });

    it("Should allow updating token prices", async function () {
      const MockERC20Factory = await ethers.getContractFactory("MockERC20");
      const mockToken = await MockERC20Factory.deploy("Test", "TST", owner.address);
      await mockToken.waitForDeployment();
      await mockOracle.setTokenPrice(await mockToken.getAddress(), 12345);
      const newPrice = 54321;
      await mockOracle.setTokenPrice(await mockToken.getAddress(), newPrice);
      const updatedPrice = await mockOracle.getPrice(await mockToken.getAddress());
      expect(updatedPrice).to.equal(newPrice);
    });
  });

  describe("Full Flow Test", function () {
    let testFund: Fund;

    it("Should execute the complete fund lifecycle - deployment, creation, buy, sell", async function () {
      // ======== CONFIGURE ORACLE ========
      // Set mock prices for all tokens (in USD with 8 decimals)
      await mockOracle.setTokenPrice(ethers.ZeroAddress, 30 * 1e8); // AVAX (for Fund.sol internal calculations)
      await mockOracle.setTokenPrice(fujiWavaxAddress, 30 * 1e8); // WAVAX
      await mockOracle.setTokenPrice("0x20E65F58Fca6D9442189d66B779A0A4FC5eDc3DD", 1 * 1e8); // ELK
      await mockOracle.setTokenPrice("0xf0D530cD6612b95c388c07C1BED5fe0B835cBF4c", 2 * 1e8); // COW
      await mockOracle.setTokenPrice("0xED29d041160060de2d540decD271D085Fec3e450", 3 * 1e8); // TUR
      await mockOracle.setTokenPrice("0xEa81F6972aDf76765Fd1435E119Acc0Aafc80BeA", 4 * 1e8); // JOE
      await mockOracle.setTokenPrice("0xf4E0A9224e8827dE91050b528F34e2F99C82Fbf6", 5 * 1e8); // UNI
      await mockOracle.setTokenPrice("0x72C14f7fB8B14040dA6E5b1B9D1B9438ebD85F58", 6 * 1e8); // SUSHI
      await mockOracle.setTokenPrice("0x20C62EEde571409f7101076F8dA0221867AA46dc", 7 * 1e8); // PNG

      // ======== FUND CREATION ========
      // Get creation fee and transfer AGI to user1
      const requiredAgi = await fundFactory.FUND_CREATION_FEE();
      await agiToken.transfer(user1.address, requiredAgi);

      // Approve factory to spend AGI
      await agiToken.connect(user1).approve(await fundFactory.getAddress(), requiredAgi);

      // Define underlying tokens for the fund
      const tokens = ["0x20C62EEde571409f7101076F8dA0221867AA46dc"]; // PNG

      // Create the fund
      await fundFactory.connect(user1).createFund("Test Fund All Tokens", "TSTAT", tokens);

      // Get the new fund's address
      const totalFunds = await fundFactory.getTotalFunds();
      const [fundAddr] = await fundFactory.getFund(totalFunds - 1n);
      testFund = (await ethers.getContractAt("Fund", fundAddr)) as Fund;

      // ======== BUY FUND TOKENS ========
      // Buy with 0.01 AVAX
      const buyAmount = ethers.parseEther("0.01");
      await testFund.connect(user2).buy({ value: buyAmount });

      const balance = await testFund.balanceOf(user2.address);
      expect(balance).to.be.gt(0);

      // ======== SELL FUND TOKENS ========
      // Approve and Sell all fund tokens
      await testFund.connect(user2).approve(fundAddr, balance);
      await testFund.connect(user2).sell(balance);
      const finalBalance = await testFund.balanceOf(user2.address);
      expect(finalBalance).to.equal(0);
    });
  });
});
