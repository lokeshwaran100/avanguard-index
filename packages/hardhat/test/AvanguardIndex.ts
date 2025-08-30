import { expect } from "chai";
import { ethers } from "hardhat";
import { AGIToken, MockOracle, FundFactory, Fund, MockERC20, MockDEX } from "../typechain-types";

describe("Avanguard Index", function () {
  let agiToken: AGIToken;
  let mockOracle: MockOracle;
  let mockDex: MockDEX;
  let fundFactory: FundFactory;
  let mockUSDC: MockERC20;
  let mockUSDT: MockERC20;
  let mockWBTC: MockERC20;
  let owner: any;
  let user1: any;
  let user2: any;

  before(async () => {
    [owner, user1, user2] = await ethers.getSigners();
  });

  beforeEach(async () => {
    // Deploy AGI Token
    const AGITokenFactory = await ethers.getContractFactory("AGIToken");
    agiToken = (await AGITokenFactory.deploy(owner.address)) as AGIToken;
    await agiToken.waitForDeployment();

    // Deploy Mock Oracle
    const MockOracleFactory = await ethers.getContractFactory("MockOracle");
    mockOracle = (await MockOracleFactory.deploy()) as MockOracle;
    await mockOracle.waitForDeployment();

    // Deploy Mock DEX
    const MockDEXFactory = await ethers.getContractFactory("MockDEX");
    mockDex = (await MockDEXFactory.deploy(await mockOracle.getAddress())) as MockDEX;
    await mockDex.waitForDeployment();

    // Deploy Fund Factory
    const FundFactoryFactory = await ethers.getContractFactory("FundFactory");
    fundFactory = (await FundFactoryFactory.deploy(
      await agiToken.getAddress(),
      await mockOracle.getAddress(),
      owner.address,
      await mockDex.getAddress(),
      owner.address
    )) as FundFactory;
    await fundFactory.waitForDeployment();

    // Deploy Mock Tokens
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    mockUSDC = (await MockERC20Factory.deploy("USD Coin", "USDC", owner.address)) as MockERC20;
    await mockUSDC.waitForDeployment();

    mockUSDT = (await MockERC20Factory.deploy("Tether USD", "USDT", owner.address)) as MockERC20;
    await mockUSDT.waitForDeployment();

    mockWBTC = (await MockERC20Factory.deploy("Wrapped Bitcoin", "WBTC", owner.address)) as MockERC20;
    await mockWBTC.waitForDeployment();

    // Set mock prices
    await mockOracle.setTokenPrice(await mockUSDC.getAddress(), 100000000); // $1.00
    await mockOracle.setTokenPrice(await mockUSDT.getAddress(), 100000000); // $1.00
    await mockOracle.setTokenPrice(await mockWBTC.getAddress(), 30000000000); // $30,000.00

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
      const tokens = [await mockUSDC.getAddress(), await mockUSDT.getAddress()];
      const weightages = [5000, 5000]; // 50% each

      // Approve AGI tokens for fund creation
      await agiToken.connect(user1).approve(await fundFactory.getAddress(), ethers.parseEther("1000"));

      // Create fund
      await fundFactory.connect(user1).createFund(fundName, fundTicker, tokens, weightages);

      // Check if fund was created
      const fundCount = await fundFactory.getTotalFunds();
      expect(fundCount).to.equal(1);

      const result = await fundFactory.getFund(0);
      const fundAddress = result[0];
      const name = result[1];
      const ticker = result[2];
      const underlyingTokens = result[3];
      const fundWeightages = result[4];
      
      expect(name).to.equal(fundName);
      expect(ticker).to.equal(fundTicker);
      expect(underlyingTokens).to.deep.equal(tokens);
      expect(fundWeightages).to.deep.equal(weightages);
    });

    it("Should require AGI tokens for fund creation", async function () {
      const fundName = "Test Fund";
      const fundTicker = "TEST";
      const tokens = [await mockUSDC.getAddress()];
      const weightages = [10000]; // 100%

      // Try to create fund without approving AGI tokens
      await expect(
        fundFactory.connect(user2).createFund(fundName, fundTicker, tokens, weightages)
      ).to.be.reverted;
    });
  });

  describe("Fund", function () {
    let testFund: Fund;

    beforeEach(async () => {
      // Create a test fund
      const fundName = "Test Fund";
      const fundTicker = "TEST";
      const tokens = [await mockUSDC.getAddress(), await mockUSDT.getAddress()];
      const weightages = [5000, 5000]; // 50% each

      await agiToken.connect(user1).approve(await fundFactory.getAddress(), ethers.parseEther("1000"));
      await fundFactory.connect(user1).createFund(fundName, fundTicker, tokens, weightages);

      const result = await fundFactory.getFund(0);
      const fundAddress = result[0];
      testFund = await ethers.getContractAt("Fund", fundAddress) as Fund;
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
      const usdcBalance = await testFund.getTokenBalance(await mockUSDC.getAddress());
      const usdtBalance = await testFund.getTokenBalance(await mockUSDT.getAddress());
      
      expect(usdcBalance).to.be.gt(0);
      expect(usdtBalance).to.be.gt(0);
    });
  });

  describe("Oracle", function () {
    it("Should return correct token prices", async function () {
      const usdcPrice = await mockOracle.getPrice(await mockUSDC.getAddress());
      expect(usdcPrice).to.equal(100000000); // $1.00

      const wbtcPrice = await mockOracle.getPrice(await mockWBTC.getAddress());
      expect(wbtcPrice).to.equal(30000000000); // $30,000.00
    });

    it("Should allow updating token prices", async function () {
      const newPrice = 200000000; // $2.00
      await mockOracle.setTokenPrice(await mockUSDC.getAddress(), newPrice);

      const updatedPrice = await mockOracle.getPrice(await mockUSDC.getAddress());
      expect(updatedPrice).to.equal(newPrice);
    });
  });

  describe("Mock DEX", function () {
    it("Should calculate expected output amounts", async function () {
      const amountIn = ethers.parseEther("1");
      const expectedOutput = await mockDex.getAmountsOut(await mockUSDC.getAddress(), amountIn);
      expect(expectedOutput).to.be.gt(0);
    });

    it("Should handle AVAX to token swaps", async function () {
      const avaxAmount = ethers.parseEther("1");
      const expectedTokens = await mockDex.getAmountsOut(ethers.ZeroAddress, avaxAmount);
      expect(expectedTokens).to.equal(avaxAmount); // 1:1 ratio in mock
    });
  });
});
