// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

contract GameBank is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address payable;

    struct SessionSettlement {
        address player;
        bool finalized;
        bool withdrawn;
        uint256 payoutAvax;
        uint256 payoutCoq;
        uint256 payoutKet;
        uint256 payoutNochill;
    }

    address public settlementSigner;
    address public immutable coqToken;
    address public immutable ketToken;
    address public immutable nochillToken;

    mapping(bytes32 => SessionSettlement) public sessions;
    mapping(bytes32 => mapping(address => uint256)) public deposits;
    mapping(address => uint256) public payoutCaps;
    mapping(address => bool) public supportedToken;

    event DepositReceived(address indexed player, bytes32 indexed sessionId, address indexed token, uint256 amount);
    event TreasuryFunded(address indexed token, uint256 amount);
    event SessionFinalized(
        bytes32 indexed sessionId,
        address indexed player,
        uint256 payoutAvax,
        uint256 payoutCoq,
        uint256 payoutKet,
        uint256 payoutNochill
    );
    event WithdrawalExecuted(
        bytes32 indexed sessionId,
        address indexed player,
        uint256 payoutAvax,
        uint256 payoutCoq,
        uint256 payoutKet,
        uint256 payoutNochill
    );
    event SettlementSignerUpdated(address indexed signer);
    event PayoutCapUpdated(address indexed token, uint256 cap);

    constructor(
        address initialOwner,
        address signer_,
        address coq_,
        address ket_,
        address nochill_,
        uint256 avaxCap_,
        uint256 coqCap_,
        uint256 ketCap_,
        uint256 nochillCap_
    ) Ownable(initialOwner) {
        require(signer_ != address(0), "invalid signer");
        require(coq_ != address(0) && ket_ != address(0) && nochill_ != address(0), "invalid token");

        settlementSigner = signer_;
        coqToken = coq_;
        ketToken = ket_;
        nochillToken = nochill_;

        supportedToken[address(0)] = true;
        supportedToken[coq_] = true;
        supportedToken[ket_] = true;
        supportedToken[nochill_] = true;

        payoutCaps[address(0)] = avaxCap_;
        payoutCaps[coq_] = coqCap_;
        payoutCaps[ket_] = ketCap_;
        payoutCaps[nochill_] = nochillCap_;
    }

    function deposit(bytes32 sessionId, address token, uint256 amount) external payable whenNotPaused nonReentrant {
        require(amount > 0, "invalid amount");
        require(supportedToken[token], "unsupported token");

        SessionSettlement storage session = sessions[sessionId];
        if (session.player == address(0)) {
            session.player = msg.sender;
        } else {
            require(session.player == msg.sender, "wrong player");
        }

        if (token == address(0)) {
            require(msg.value == amount, "bad avax deposit");
        } else {
            require(msg.value == 0, "unexpected value");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        deposits[sessionId][token] += amount;
        emit DepositReceived(msg.sender, sessionId, token, amount);
    }

    function fundBank(address token, uint256 amount) external payable onlyOwner nonReentrant {
        require(supportedToken[token], "unsupported token");
        require(amount > 0, "invalid amount");

        if (token == address(0)) {
            require(msg.value == amount, "bad avax amount");
        } else {
            require(msg.value == 0, "unexpected value");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        emit TreasuryFunded(token, amount);
    }

    function finalize(
        bytes32 sessionId,
        uint256 payoutAvax,
        uint256 payoutCoq,
        uint256 payoutKet,
        uint256 payoutNochill,
        bytes calldata serverSig
    ) external whenNotPaused {
        SessionSettlement storage session = sessions[sessionId];
        require(session.player != address(0), "unknown session");
        require(!session.finalized, "already finalized");
        require(_validPayouts(payoutAvax, payoutCoq, payoutKet, payoutNochill), "cap exceeded");

        bytes32 digest = keccak256(
            abi.encodePacked(
                address(this),
                block.chainid,
                sessionId,
                session.player,
                payoutAvax,
                payoutCoq,
                payoutKet,
                payoutNochill
            )
        );

        address recovered = ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(digest), serverSig);
        require(recovered == settlementSigner, "invalid signature");

        session.finalized = true;
        session.payoutAvax = payoutAvax;
        session.payoutCoq = payoutCoq;
        session.payoutKet = payoutKet;
        session.payoutNochill = payoutNochill;

        emit SessionFinalized(sessionId, session.player, payoutAvax, payoutCoq, payoutKet, payoutNochill);
    }

    function withdraw(bytes32 sessionId) external nonReentrant {
        SessionSettlement storage session = sessions[sessionId];
        require(session.player == msg.sender, "not player");
        require(session.finalized, "not finalized");
        require(!session.withdrawn, "already withdrawn");

        session.withdrawn = true;

        if (session.payoutAvax > 0) {
            payable(msg.sender).sendValue(session.payoutAvax);
        }
        if (session.payoutCoq > 0) {
            IERC20(coqToken).safeTransfer(msg.sender, session.payoutCoq);
        }
        if (session.payoutKet > 0) {
            IERC20(ketToken).safeTransfer(msg.sender, session.payoutKet);
        }
        if (session.payoutNochill > 0) {
            IERC20(nochillToken).safeTransfer(msg.sender, session.payoutNochill);
        }

        emit WithdrawalExecuted(
            sessionId,
            session.player,
            session.payoutAvax,
            session.payoutCoq,
            session.payoutKet,
            session.payoutNochill
        );
    }

    function setSettlementSigner(address signer_) external onlyOwner {
        require(signer_ != address(0), "invalid signer");
        settlementSigner = signer_;
        emit SettlementSignerUpdated(signer_);
    }

    function setPayoutCap(address token, uint256 cap) external onlyOwner {
        require(supportedToken[token], "unsupported token");
        payoutCaps[token] = cap;
        emit PayoutCapUpdated(token, cap);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _validPayouts(
        uint256 payoutAvax,
        uint256 payoutCoq,
        uint256 payoutKet,
        uint256 payoutNochill
    ) private view returns (bool) {
        return
            payoutAvax <= payoutCaps[address(0)] &&
            payoutCoq <= payoutCaps[coqToken] &&
            payoutKet <= payoutCaps[ketToken] &&
            payoutNochill <= payoutCaps[nochillToken];
    }
}

