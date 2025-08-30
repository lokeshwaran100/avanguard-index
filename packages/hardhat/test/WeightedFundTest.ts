import { expect } from "chai";
import { ethers } from "hardhat";
import { AGIToken, MockOracle, FundFactory, Fund, MockERC20, MockDEX } from "../typechain-types";

describe("Weighted Fund Tests", function () {
  let fundFactory: FundFactory;
  let agiToken: AGIToken;
  let mockOracle: MockOracle;
  let mockDex: MockDEX;
  let mockUSDC: MockERC20;
  let mockUSDT: MockERC20;
  let mockWBTC: MockERC20;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy AGI Token
    const AGIToken = await ethers.getContractFactory("AGIToken");
    agiToken = await AGIToken.deploy(await owner.getAddress());
    await agiToken.waitForDeployment();

    // Deploy Mock Oracle
    const MockOracle = await ethers.getContractFactory("MockOracle");
    mockOracle = await MockOracle.deploy();
    await mockOracle.waitForDeployment();

    // Deploy Mock DEX
    const MockDEX = await ethers.getContractFactory("MockDEX");
    mockDex = await MockDEX.deploy(await mockOracle.getAddress());
    await mockDex.waitForDeployment();

    // Deploy Fund Factory
    const FundFactory = await ethers.getContractFactory("FundFactory");
    fundFactory = await FundFactory.deploy(
      await agiToken.getAddress(),
      await mockOracle.getAddress(),
      await owner.getAddress(),
      await mockDex.getAddress(),
      await owner.getAddress()
    );
    await fundFactory.waitForDeployment();

    // Deploy Mock Tokens
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockUSDC = await MockERC20.deploy("USD Coin", "USDC", await owner.getAddress());
    await mockUSDC.waitForDeployment();
    
    mockUSDT = await MockERC20.deploy("Tether USD", "USDT", await owner.getAddress());
    await mockUSDT.waitForDeployment();
    
    mockWBTC = await MockERC20.deploy("Wrapped Bitcoin", "WBTC", await owner.getAddress());
    await mockWBTC.waitForDeployment();

    // Set mock prices
    await mockOracle.setTokenPrice(await mockUSDC.getAddress(), 100000000); // $1.00
    await mockOracle.setTokenPrice(await mockUSDT.getAddress(), 100000000); // $1.00
    await mockOracle.setTokenPrice(await mockWBTC.getAddress(), 30000000000); // $30,000.00
    await mockOracle.setTokenPrice(ethers.ZeroAddress, 25000000000); // AVAX $25,000.00

    // Transfer AGI tokens to user1 for fund creation fee
    await agiToken.transfer(await user1.getAddress(), ethers.parseEther("2000"));
  });

  describe("Fund Creation with Weightages", function () {
    it("Should create a fund with weighted token allocations", async function () {
      const tokens = [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockWBTC.getAddress()];
      const weightages = [4000, 3000, 3000]; // 40% USDC, 30% USDT, 30% WBTC

      // Approve AGI tokens for fund creation
      await agiToken.connect(user1).approve(await fundFactory.getAddress(), ethers.parseEther("1000"));

      // Create fund
      await fundFactory.connect(user1).createFund(
        "Test Weighted Fund",
        "TWF",
        tokens,
        weightages
      );

      // Get fund information
      const fundInfo = await fundFactory.getFund(0);
      expect(fundInfo.fundName).to.equal("Test Weighted Fund");
      expect(fundInfo.fundTicker).to.equal("TWF");
      expect(fundInfo.underlyingTokens).to.deep.equal(tokens);
      expect(fundInfo.weightages).to.deep.equal(weightages);
    });

    it("Should reject fund creation with invalid weightages", async function () {
      const tokens = [await mockUSDC.getAddress(), await mockUSDT.getAddress()];
      const invalidWeightages = [6000, 3000]; // Only 90%, should be 100%

      await agiToken.connect(user1).approve(await fundFactory.getAddress(), ethers.parseEther("1000"));

      await expect(
        fundFactory.connect(user1).createFund(
          "Invalid Fund",
          "IF",
          tokens,
          invalidWeightages
        )
      ).to.be.revertedWith("Total weightage must be 100%");
    });

    it("Should reject fund creation with mismatched arrays", async function () {
      const tokens = [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockWBTC.getAddress()];
      const weightages = [5000, 5000]; // Only 2 weightages for 3 tokens

      await agiToken.connect(user1).approve(await fundFactory.getAddress(), ethers.parseEther("1000"));

      await expect(
        fundFactory.connect(user1).createFund(
          "Mismatched Fund",
          "MF",
          tokens,
          weightages
        )
      ).to.be.revertedWith("Tokens and weightages length mismatch");
    });
  });

  describe("Fund Operations with Weightages", function () {
    let fund: Fund;

    beforeEach(async function () {
      const tokens = [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockWBTC.getAddress()];
      const weightages = [4000, 3000, 3000]; // 40% USDC, 30% USDT, 30% WBTC

      await agiToken.connect(user1).approve(await fundFactory.getAddress(), ethers.parseEther("1000"));
      await fundFactory.connect(user1).createFund(
        "Test Weighted Fund",
        "TWF",
        tokens,
        weightages
      );

      const fundInfo = await fundFactory.getFund(0);
      fund = await ethers.getContractAt("Fund", fundInfo.fundAddress) as Fund;
    });

    it("Should buy fund tokens with weighted allocation", async function () {
      const buyAmount = ethers.parseEther("10"); // 10 AVAX

      // Buy fund tokens
      await fund.connect(user2).buy({ value: buyAmount });

      // Check fund token balance
      const fundTokenBalance = await fund.balanceOf(await user2.getAddress());
      expect(fundTokenBalance).to.be.gt(0);

      // Check underlying token balances (should be allocated based on weightages)
      const usdcBalance = await fund.getTokenBalance(await mockUSDC.getAddress());
      const usdtBalance = await fund.getTokenBalance(await mockUSDT.getAddress());
      const wbtcBalance = await fund.getTokenBalance(await mockWBTC.getAddress());

      // All balances should be greater than 0 due to weightage allocation
      expect(usdcBalance).to.be.gt(0);
      expect(usdtBalance).to.be.gt(0);
      expect(wbtcBalance).to.be.gt(0);
    });

    it("Should sell fund tokens proportionally", async function () {
      const buyAmount = ethers.parseEther("10");
      
      // Buy fund tokens first
      await fund.connect(user2).buy({ value: buyAmount });
      const initialBalance = await fund.balanceOf(await user2.getAddress());

      // Sell half of the fund tokens
      const sellAmount = initialBalance / 2n;
      await fund.connect(user2).sell(sellAmount);

      // Check remaining fund token balance
      const remainingBalance = await fund.balanceOf(await user2.getAddress());
      expect(remainingBalance).to.equal(initialBalance - sellAmount);
    });

    it("Should allow rebalancing by owner", async function () {
      const newWeightages = [5000, 2500, 2500]; // 50% USDC, 25% USDT, 25% WBTC
      const tokens = [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockWBTC.getAddress()];

      // First buy some fund tokens to have value to rebalance
      await fund.connect(user2).buy({ value: ethers.parseEther("5") });

      // Rebalance the fund
      await fund.connect(user1).rebalance(tokens, newWeightages);

      // Verify weightages were updated
      const result = await fund.getAllTokenWeightages();
      const updatedTokens = result[0];
      const updatedWeightages = result[1];
      expect(updatedWeightages).to.deep.equal(newWeightages);
    });

    it("Should perform actual rebalancing when weightages change", async function () {
      // First buy some fund tokens to have value to rebalance
      await fund.connect(user2).buy({ value: ethers.parseEther("10") });

      // Get initial token balances
      const initialUSDCBalance = await fund.getTokenBalance(await mockUSDC.getAddress());
      const initialUSDTBalance = await fund.getTokenBalance(await mockUSDT.getAddress());
      const initialWBTCBalance = await fund.getTokenBalance(await mockWBTC.getAddress());

      // Verify initial balances are proportional to weightages (40%, 30%, 30%)
      expect(initialUSDCBalance).to.be.gt(0);
      expect(initialUSDTBalance).to.be.gt(0);
      expect(initialWBTCBalance).to.be.gt(0);

      // Calculate initial ratios
      const initialTotalBalance = initialUSDCBalance + initialUSDTBalance + initialWBTCBalance;
      const initialUSDCRatio = (initialUSDCBalance * 10000n) / initialTotalBalance;
      const initialUSDTRatio = (initialUSDTBalance * 10000n) / initialTotalBalance;
      const initialWBTCRatio = (initialWBTCBalance * 10000n) / initialTotalBalance;

      // Change weightages to favor USDC more (from 40% to 60%)
      const newWeightages = [6000, 2000, 2000]; // 60% USDC, 20% USDT, 20% WBTC
      const tokens = [await mockUSDC.getAddress(), await mockUSDT.getAddress(), await mockWBTC.getAddress()];

      // Rebalance the fund
      await fund.connect(user1).rebalance(tokens, newWeightages);

      // Get final token balances
      const finalUSDCBalance = await fund.getTokenBalance(await mockUSDC.getAddress());
      const finalUSDTBalance = await fund.getTokenBalance(await mockUSDT.getAddress());
      const finalWBTCBalance = await fund.getTokenBalance(await mockWBTC.getAddress());

      // Calculate final ratios
      const finalTotalBalance = finalUSDCBalance + finalUSDTBalance + finalWBTCBalance;
      const finalUSDCRatio = (finalUSDCBalance * 10000n) / finalTotalBalance;
      const finalUSDTRatio = (finalUSDTBalance * 10000n) / finalTotalBalance;
      const finalWBTCRatio = (finalWBTCBalance * 10000n) / finalTotalBalance;

      // USDC ratio should increase (from ~40% to ~60%)
      expect(finalUSDCRatio).to.be.gt(initialUSDCRatio);
      
      // USDT and WBTC ratios should decrease (from ~30% to ~20%)
      expect(finalUSDTRatio).to.be.lt(initialUSDTRatio);
      expect(finalWBTCRatio).to.be.lt(initialWBTCRatio);

      // Verify weightages were updated
      const result = await fund.getAllTokenWeightages();
      const updatedWeightages = result[1];
      expect(updatedWeightages).to.deep.equal(newWeightages);

      // Verify the ratios are approximately correct (allowing for some rounding)
      expect(finalUSDCRatio).to.be.closeTo(6000n, 500n);
      expect(finalUSDTRatio).to.be.closeTo(2000n, 500n);
      expect(finalWBTCRatio).to.be.closeTo(2000n, 500n);
    });

    it("Should validate weightages correctly", async function () {
      const isValid = await fund.validateWeightages();
      expect(isValid).to.be.true;
    });

    it("Should get fund composition", async function () {
      const buyAmount = ethers.parseEther("5");
      await fund.connect(user2).buy({ value: buyAmount });

      const result = await fund.getFundComposition();
      const tokens = result[0];
      const balances = result[1];
      const weightages = result[2];
      
      expect(tokens.length).to.equal(3);
      expect(balances.length).to.equal(3);
      expect(weightages.length).to.equal(3);
      
      // Check that all balances are greater than 0 after buying
      for (let i = 0; i < balances.length; i++) {
        expect(balances[i]).to.be.gt(0);
        expect(weightages[i]).to.be.gt(0);
      }
    });
  });
});
