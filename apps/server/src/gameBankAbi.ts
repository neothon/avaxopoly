export const GAME_BANK_ABI = [
  "event DepositReceived(address indexed player, bytes32 indexed sessionId, address indexed token, uint256 amount)",
  "function deposit(bytes32 sessionId, address token, uint256 amount) payable",
  "function finalize(bytes32 sessionId, uint256 payoutAvax, uint256 payoutCoq, uint256 payoutKet, uint256 payoutNochill, bytes serverSig)",
  "function withdraw(bytes32 sessionId)"
] as const;

