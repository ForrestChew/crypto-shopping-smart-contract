const { ethers } = require("hardhat");
const { expect } = require("chai");
const { itParam } = require("mocha-param");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe.only("CryptoShopping", async () => {
  const deployCryptoShoppingFixture = async () => {
    const [adminAccount, regAccount] = await ethers.getSigners();
    const CryptoShopping = await ethers.getContractFactory("CryptoShopping");
    const cryptoShopping = await CryptoShopping.deploy(adminAccount.address);
    return { cryptoShopping, adminAccount, regAccount };
  };

  describe("Deployment", () => {
    it("Deploys CryptoShopping smart contract", async () => {
      const { cryptoShopping } = await loadFixture(deployCryptoShoppingFixture);
      expect(cryptoShopping.address.length).to.equal(42);
    });
    it("Assigns global admin variable to adminAccount address", async () => {
      const { cryptoShopping, adminAccount } = await loadFixture(
        deployCryptoShoppingFixture
      );
      expect(await cryptoShopping.admin()).to.equal(adminAccount.address);
    });
  });
  describe("Payment", () => {
    itParam(
      "Sends ${value} ETH from account to CryptoShopping smart contract",
      ["1", "2", "3", "100", "241"],
      async (value) => {
        const { cryptoShopping, regAccount } = await loadFixture(
          deployCryptoShoppingFixture
        );
        const contractBalanceBefore = await cryptoShopping.getContractBalance();
        expect(contractBalanceBefore).to.equal(0);
        await regAccount.sendTransaction({
          value: ethers.utils.parseEther(value),
          to: cryptoShopping.address,
        });
        const contractBalanceAfter = await cryptoShopping.getContractBalance();
        expect(contractBalanceAfter).to.equal(ethers.utils.parseEther(value));
      }
    );
    itParam(
      "Emits NewPayment event from smart contract",
      ["1.6432", "2.323", "2", "100.33", "241.00"],
      async (value) => {
        const { cryptoShopping, regAccount } = await loadFixture(
          deployCryptoShoppingFixture
        );
        await expect(
          regAccount.sendTransaction({
            value: ethers.utils.parseEther(value),
            to: cryptoShopping.address,
          })
        )
          .to.emit(cryptoShopping, "NewPayment")
          .withArgs(regAccount.address, ethers.utils.parseEther(value));
      }
    );
  });
  describe("Withdrawl of funds", () => {
    itParam(
      "Admin account withdraws ${value} ETH (all funds in contract)",
      ["1", "3", "4", ".12325", "20", "300", ".532", ".31231"],
      async (value) => {
        const { cryptoShopping, adminAccount, regAccount } = await loadFixture(
          deployCryptoShoppingFixture
        );
        await regAccount.sendTransaction({
          value: ethers.utils.parseEther(value),
          to: cryptoShopping.address,
        });
        expect(await cryptoShopping.getContractBalance()).to.equal(
          ethers.utils.parseEther(value)
        );
        await cryptoShopping.withdrawFunds({ from: adminAccount.address });
        expect(await cryptoShopping.getContractBalance()).to.equal(0);
      }
    );
    itParam(
      "Non-admin account fails to withdraw ${value} ETH (all funds)",
      ["34", "56", "3", ".8", ".46"],
      async (value) => {
        const { cryptoShopping, regAccount } = await loadFixture(
          deployCryptoShoppingFixture
        );
        await regAccount.sendTransaction({
          value: ethers.utils.parseEther(value),
          to: cryptoShopping.address,
        });
        await expect(
          cryptoShopping
            .connect(regAccount)
            .withdrawFunds({ from: regAccount.address })
        ).to.be.revertedWith("withdrawFunds: Only admin");
      }
    );
  });
});
