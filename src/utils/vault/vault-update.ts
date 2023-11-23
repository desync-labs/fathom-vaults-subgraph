import { Address, BigInt, Bytes, log } from '@graphprotocol/graph-ts';
import {
  Token,
  Transaction,
  Vault,
  VaultUpdate,
  StrategyReport
} from '../../../generated/schema';
import { BIGINT_ZERO } from '../constants';
import { updateVaultDayData } from './vault-day-data';
import { FathomVault } from '../../../generated/FathomVault/FathomVault';
import { getTotalAssets } from './vault';

export function buildIdFromVaultTxHashAndIndex(
  vault: string,
  transactionHash: string,
  transactionIndex: string
): string {
  return vault
    .concat('-')
    .concat(transactionHash.concat('-').concat(transactionIndex));
}

export function buildIdFromVaultAndTransaction(
  vault: Vault,
  transaction: Transaction
): string {
  return buildIdFromVaultTxHashAndIndex(
    vault.id,
    transaction.id,
    transaction.index.toString()
  );
}

function createVaultUpdate(
  id: string,
  timestamp: BigInt,
  blockNumber: BigInt,
  transaction: Transaction,
  vault: Vault,
  tokensDeposited: BigInt,
  tokensWithdrawn: BigInt,
  sharesMinted: BigInt,
  sharesBurnt: BigInt,
  balancePosition: BigInt,
  returnsGenerated: BigInt,
  // These field(s) are accumulators, so they are added to the previous's VaultUpdate's value, if available.
  // Their final representation in the VaultUpdate will be as a "total" field, so:
  // totalFees(n) = totalFees(n-1)+feesPaid
  feesPaid: BigInt | null,
  newProtocolFee: BigInt | null,
  depositLimit: BigInt,
  accountant: Bytes,
  roleManager: Bytes,
  depositLimitModule: Bytes,
  withdrawLimitModule: Bytes,
  minimumTotalIdle: BigInt,
  profitMaxUnlockTime: BigInt,
  totalDebtAmount: BigInt,
  totalIdleAmount: BigInt,
  shutdown: boolean
): VaultUpdate {
  log.debug('[VaultUpdate] Creating vault update with id {}', [id]);

  let vaultUpdate = constructVaultUpdateEntity(
    id,
    transaction,
    vault,
    feesPaid
  );

  vaultUpdate.depositLimit = depositLimit;
  vaultUpdate.newProtocolFee = newProtocolFee;

  // Balances & Shares
  vaultUpdate.tokensDeposited = tokensDeposited;
  vaultUpdate.tokensWithdrawn = tokensWithdrawn;
  vaultUpdate.sharesMinted = sharesMinted;
  vaultUpdate.sharesBurnt = sharesBurnt;
  // Performance
  vaultUpdate.balancePosition = balancePosition;
  vaultUpdate.returnsGenerated = returnsGenerated;
  vaultUpdate.accountant = accountant;
  vaultUpdate.roleManager = roleManager;
  vaultUpdate.depositLimitModule = depositLimitModule;
  vaultUpdate.withdrawLimitModule = withdrawLimitModule;

  vaultUpdate.timestamp = timestamp;
  vaultUpdate.blockNumber = blockNumber;
  vaultUpdate.minimumTotalIdle = minimumTotalIdle;
  vaultUpdate.profitMaxUnlockTime = profitMaxUnlockTime;
  vaultUpdate.totalDebtAmount = totalDebtAmount;
  vaultUpdate.totalIdleAmount = totalIdleAmount;
  vaultUpdate.shutdown = shutdown;
  vaultUpdate.save();

  vault.latestUpdate = vaultUpdate.id;
  vault.balanceTokens = vaultUpdate.currentBalanceTokens;
  // todo: current implementation of balanceTokensIdle does not update when debt is issued to strategies
  vault.balanceTokensIdle = vault.balanceTokensIdle
    .plus(tokensDeposited)
    .minus(tokensWithdrawn);

  vault.sharesSupply = vault.sharesSupply.plus(sharesMinted).minus(sharesBurnt);

  vault.save();

  updateVaultDayData(transaction, vault, vaultUpdate);

  return vaultUpdate;
}

/* This function generates a fresh VaultUpdate entity whose 'current' fields and accrued fields are populated correctly. */
function constructVaultUpdateEntity(
  id: string,
  transaction: Transaction,
  vault: Vault,
  providedFeesPaid: BigInt | null
): VaultUpdate {
  let previousVaultUpdate: VaultUpdate | null;
  if (vault.latestUpdate != null) {
    previousVaultUpdate = VaultUpdate.load(vault.latestUpdate!);
  }

  let vaultAddress = Address.fromString(vault.id);
  let vaultContract = FathomVault.bind(vaultAddress);
  // Populate the totalFees parameter.
  // This field is accrued, so we're trying to add the value passed to createVaultUpdate to whatever
  // the previous accrued value was in the previous update.
  let totalFees: BigInt;

  if (!providedFeesPaid) {
    if (!previousVaultUpdate) {
      totalFees = BIGINT_ZERO;
    } else {
      totalFees = previousVaultUpdate.totalFees;
    }
  } else {
    if (!previousVaultUpdate) {
      totalFees = providedFeesPaid as BigInt;
    } else {
      totalFees = previousVaultUpdate.totalFees.plus(providedFeesPaid as BigInt);
    }
  }

  // Populate the following parameters based on the vault's current state.
  let pricePerShare: BigInt = vaultContract.pricePerShare();
  let balanceTokens: BigInt = getTotalAssets(vaultAddress);

  let vaultUpdate = new VaultUpdate(id);
  vaultUpdate.totalFees = totalFees;
  vaultUpdate.pricePerShare = pricePerShare;
  vaultUpdate.currentBalanceTokens = balanceTokens;
  vaultUpdate.timestamp = transaction.timestamp;
  vaultUpdate.blockNumber = transaction.blockNumber;
  vaultUpdate.transaction = transaction.id;
  vaultUpdate.vault = vault.id;
  return vaultUpdate;
}

export function firstDeposit(
  vault: Vault,
  transaction: Transaction,
  depositedAmount: BigInt,
  sharesMinted: BigInt,
  balancePosition: BigInt,
  totalAssets: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt
): VaultUpdate {
  log.debug('[VaultUpdate] First deposit', []);
  let vaultUpdateId = buildIdFromVaultAndTransaction(vault, transaction);
  let vaultUpdate = VaultUpdate.load(vaultUpdateId);

  if (vaultUpdate === null) {
    vaultUpdate = createVaultUpdate(
      vaultUpdateId,
      timestamp,
      blockNumber,
      transaction,
      vault,
      depositedAmount,
      BIGINT_ZERO, // tokensWithdrawn
      sharesMinted,
      BIGINT_ZERO, // sharesBurnt
      balancePosition,
      BIGINT_ZERO, // returnsGenerated
      null, // totalFees
      null, // newProtocolFee
      vault.depositLimit,
      vault.accountant,
      vault.roleManager,
      vault.depositLimitModule,
      vault.withdrawLimitModule,
      vault.minimumTotalIdle,
      vault.profitMaxUnlockTime,
      vault.totalDebtAmount,
      vault.totalIdleAmount,
      vault.shutdown
    );
  }


  return vaultUpdate as VaultUpdate;
}

export function deposit(
  vault: Vault,
  transaction: Transaction,
  depositedAmount: BigInt,
  sharesMinted: BigInt,
  balancePosition: BigInt,
  totalAssets: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt
): VaultUpdate {
  log.debug('[VaultUpdate] Deposit', []);
  let vaultUpdateId = buildIdFromVaultAndTransaction(vault, transaction);
  let vaultUpdate = VaultUpdate.load(vaultUpdateId);

  if (vaultUpdate === null) {
    vaultUpdate = createVaultUpdate(
      vaultUpdateId,
      timestamp,
      blockNumber,
      transaction,
      vault,
      depositedAmount,
      BIGINT_ZERO, // tokensWithdrawn
      sharesMinted,
      BIGINT_ZERO, // sharesBurnt
      balancePosition,
      BIGINT_ZERO, // returnsGenerated
      null, // totalFees
      null, // newProtocolFee
      vault.depositLimit,
      vault.accountant,
      vault.roleManager,
      vault.depositLimitModule,
      vault.withdrawLimitModule,
      vault.minimumTotalIdle,
      vault.profitMaxUnlockTime,
      vault.totalDebtAmount,
      vault.totalIdleAmount,
      vault.shutdown
    );
  }

  return vaultUpdate as VaultUpdate;
}

export function withdraw(
  vault: Vault,
  withdrawnAmount: BigInt,
  sharesBurnt: BigInt,
  transaction: Transaction,
  balancePosition: BigInt,
  totalAssets: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt
): VaultUpdate {
  let vaultUpdateId = buildIdFromVaultAndTransaction(vault, transaction);

  let newVaultUpdate = createVaultUpdate(
    vaultUpdateId,
    timestamp,
    blockNumber,
    transaction,
    vault,
    BIGINT_ZERO, // TokensDeposited
    withdrawnAmount,
    BIGINT_ZERO, // SharesMinted
    sharesBurnt,
    balancePosition,
    BIGINT_ZERO, // returnsGenerated
    null, // totalFees
    null, // newProtocolFee
    vault.depositLimit,
    vault.accountant,
    vault.roleManager,
    vault.depositLimitModule,
    vault.withdrawLimitModule,
    vault.minimumTotalIdle,
    vault.profitMaxUnlockTime,
    vault.totalDebtAmount,
    vault.totalIdleAmount,
    vault.shutdown
  );
  return newVaultUpdate;
}

export function strategyReported(
  vault: Vault,
  transaction: Transaction,
  balancePosition: BigInt,
  grossReturnsGenerated: BigInt,
  currentTotalFees: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt,
): VaultUpdate {
  let vaultUpdateId = buildIdFromVaultAndTransaction(vault, transaction);

  // Need to find netReturnsGenerated by subtracting out the fees
  let vaultContract = FathomVault.bind(Address.fromString(vault.id));
  let latestVaultUpdate = VaultUpdate.load(vault.latestUpdate!);
  let pricePerShare = vaultContract.pricePerShare();

  let feesPaidDuringReport = currentTotalFees.minus(latestVaultUpdate.totalFees);

  let netReturnsGenerated = grossReturnsGenerated.minus(feesPaidDuringReport);

  let newVaultUpdate = createVaultUpdate(
    vaultUpdateId,
    timestamp,
    blockNumber,
    transaction,
    vault,
    BIGINT_ZERO, // TokensDeposited
    BIGINT_ZERO, // TokensWithdrawn
    BIGINT_ZERO, // SharesMinted
    BIGINT_ZERO, // SharesBurnt
    balancePosition,
    netReturnsGenerated,
    feesPaidDuringReport,
    null,
    vault.depositLimit,
    vault.accountant,
    vault.roleManager,
    vault.depositLimitModule,
    vault.withdrawLimitModule,
    vault.minimumTotalIdle,
    vault.profitMaxUnlockTime,
    vault.totalDebtAmount,
    vault.totalIdleAmount,
    vault.shutdown
  );
  return newVaultUpdate;
}