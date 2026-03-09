const { expect } = require("chai");
const { ethers } = require("hardhat");

function tokenAmount(value) {
  return ethers.parseUnits(value, 18);
}

async function signSettlement(gameBank, chainId, signer, sessionId, player, payouts) {
  const digest = ethers.solidityPackedKeccak256(
    ["address", "uint256", "bytes32", "address", "uint256", "uint256", "uint256", "uint256"],
    [
      await gameBank.getAddress(),
      chainId,
      sessionId,
      player,
      payouts.avax,
      payouts.coq,
      payouts.ket,
      payouts.nochill
    ]
  );
  return signer.signMessage(ethers.getBytes(digest));
}

describe("GameBank", function () {
  async function deployFixture() {
    const [owner, settlementSigner, player, attacker] = await ethers.getSigners();
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const coq = await MockERC20.deploy("Coq", "COQ");
    const ket = await MockERC20.deploy("Ket", "KET");
    const nochill = await MockERC20.deploy("NoChill", "NOCHILL");
    const GameBank = await ethers.getContractFactory("GameBank");
    const bank = await GameBank.deploy(
      owner.address,
      settlementSigner.address,
      await coq.getAddress(),
      await ket.getAddress(),
      await nochill.getAddress(),
      tokenAmount("5000"),
      tokenAmount("25000"),
      tokenAmount("25000"),
      tokenAmount("25000")
    );

    for (const token of [coq, ket, nochill]) {
      await token.mint(player.address, tokenAmount("50000"));
      await token.mint(owner.address, tokenAmount("50000"));
    }

    return { owner, settlementSigner, player, attacker, bank, coq, ket, nochill };
  }

  it("accepts deposits, finalizes with a valid signature, and withdraws", async function () {
    const { owner, settlementSigner, player, bank, coq, ket, nochill } = await deployFixture();
    const sessionId = ethers.hexlify(ethers.randomBytes(32));
    const chainId = (await ethers.provider.getNetwork()).chainId;

    await bank.connect(owner).fundBank(ethers.ZeroAddress, tokenAmount("50"), { value: tokenAmount("50") });
    for (const token of [coq, ket, nochill]) {
      await token.connect(owner).approve(await bank.getAddress(), tokenAmount("1000"));
      await bank.connect(owner).fundBank(await token.getAddress(), tokenAmount("1000"));
    }

    await bank.connect(player).deposit(sessionId, ethers.ZeroAddress, tokenAmount("10"), { value: tokenAmount("10") });
    await coq.connect(player).approve(await bank.getAddress(), tokenAmount("100"));
    await bank.connect(player).deposit(sessionId, await coq.getAddress(), tokenAmount("100"));

    const payouts = {
      avax: tokenAmount("22"),
      coq: tokenAmount("180"),
      ket: tokenAmount("15"),
      nochill: tokenAmount("20")
    };
    const signature = await signSettlement(bank, chainId, settlementSigner, sessionId, player.address, payouts);

    await expect(
      bank.connect(player).finalize(sessionId, payouts.avax, payouts.coq, payouts.ket, payouts.nochill, signature)
    )
      .to.emit(bank, "SessionFinalized")
      .withArgs(sessionId, player.address, payouts.avax, payouts.coq, payouts.ket, payouts.nochill);

    await expect(() => bank.connect(player).withdraw(sessionId)).to.changeEtherBalances(
      [bank, player],
      [payouts.avax * -1n, payouts.avax]
    );
    expect(await coq.balanceOf(player.address)).to.equal(tokenAmount("50080"));
    expect(await ket.balanceOf(player.address)).to.equal(tokenAmount("50015"));
    expect(await nochill.balanceOf(player.address)).to.equal(tokenAmount("50020"));
  });

  it("rejects forged settlement signatures", async function () {
    const { settlementSigner, player, attacker, bank } = await deployFixture();
    const sessionId = ethers.hexlify(ethers.randomBytes(32));
    const chainId = (await ethers.provider.getNetwork()).chainId;

    await bank.connect(player).deposit(sessionId, ethers.ZeroAddress, tokenAmount("10"), { value: tokenAmount("10") });

    const payouts = {
      avax: tokenAmount("1"),
      coq: 0n,
      ket: 0n,
      nochill: 0n
    };
    const badSignature = await signSettlement(bank, chainId, attacker, sessionId, player.address, payouts);
    const goodSignature = await signSettlement(bank, chainId, settlementSigner, sessionId, player.address, payouts);

    await expect(
      bank.connect(player).finalize(sessionId, payouts.avax, payouts.coq, payouts.ket, payouts.nochill, badSignature)
    ).to.be.revertedWith("invalid signature");

    await bank.connect(player).finalize(sessionId, payouts.avax, payouts.coq, payouts.ket, payouts.nochill, goodSignature);
    await expect(
      bank.connect(player).finalize(sessionId, payouts.avax, payouts.coq, payouts.ket, payouts.nochill, goodSignature)
    ).to.be.revertedWith("already finalized");
  });

  it("rejects payouts above the configured cap", async function () {
    const { settlementSigner, player, bank } = await deployFixture();
    const sessionId = ethers.hexlify(ethers.randomBytes(32));
    const chainId = (await ethers.provider.getNetwork()).chainId;

    await bank.connect(player).deposit(sessionId, ethers.ZeroAddress, tokenAmount("10"), { value: tokenAmount("10") });

    const payouts = {
      avax: tokenAmount("5001"),
      coq: 0n,
      ket: 0n,
      nochill: 0n
    };
    const signature = await signSettlement(bank, chainId, settlementSigner, sessionId, player.address, payouts);

    await expect(
      bank.connect(player).finalize(sessionId, payouts.avax, payouts.coq, payouts.ket, payouts.nochill, signature)
    ).to.be.revertedWith("cap exceeded");
  });
});

