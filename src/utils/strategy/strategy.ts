import { log, ethereum, BigInt, Address, Bytes } from '@graphprotocol/graph-ts';
import {
  Strategy,
  StrategyReport,
  Transaction,
  Vault,
} from '../../../generated/schema';
import { VaultPackage } from '../../../generated/FathomVault/VaultPackage';
import { booleanToString, getTimeInMillis } from '../commons';
import { BIGINT_ZERO } from '../constants';
import * as strategyReportLibrary from './strategy-report';
import * as strategyReportResultLibrary from './strategy-report-result';

export function buildId(strategyAddress: Address): string {
  return strategyAddress.toHexString();
}

export function createAndGet(
  transactionId: string,
  strategyAddress: Address,
  vault: Address,
  currentDebt: BigInt,
  maxDebt: BigInt,
  transaction: Transaction
): Strategy {
  log.info('[Strategy] CreateAndGet strategy {} in vault {} in TxHash {}', [
    strategyAddress.toHexString(),
    vault.toHexString(),
    transaction.hash.toHexString(),
  ]);
  let strategyId = buildId(strategyAddress);
  let strategy = Strategy.load(strategyId);
  if (strategy == null) {
    log.info('[Strategy] Create new strategy {} in vault {} in TxHash {}', [
      strategyAddress.toHexString(),
      vault.toHexString(),
      transaction.hash.toHexString(),
    ]);
    strategy = new Strategy(strategyId);
    strategy.activation = getTimeInMillis(transaction.timestamp);
    strategy.transaction = transactionId;
    strategy.vault = vault.toHexString();
    strategy.currentDebt = currentDebt;
    strategy.maxDebt = maxDebt;
    strategy.delegatedAssets = BigInt.fromI32(0);
    strategy.inQueue = true;

    strategy.save();

    let vaultInstance = Vault.load(vault.toHexString());
    if (vaultInstance != null) {
      // Add the new strategy to the withdrawl queue of the vault
      let withdrawlQueue = vaultInstance.defaultQueue;
      withdrawlQueue.push(strategyAddress.toHexString());
      vaultInstance.defaultQueue = withdrawlQueue;

      // Add strategy ids to vault
      let strategyIds = vaultInstance.strategyIds;
      strategyIds.push(strategyId);
      vaultInstance.strategyIds = strategyIds;
      vaultInstance.save();
    }
  }
  return strategy as Strategy;
}

export function createReport(
  transaction: Transaction,
  strategyId: string,
  gain: BigInt,
  loss: BigInt,
  currentDebt: BigInt,
  protocolFees: BigInt,
  totalFees: BigInt,
  totalRefunds: BigInt,
  event: ethereum.Event
): StrategyReport | null {
  let txHash = transaction.hash.toHexString();
  log.info('[Strategy] Create report for strategy {}', [strategyId]);
  let strategy = Strategy.load(strategyId);
  if (strategy !== null) {
    let currentReportId = strategy.latestReport;
    log.info(
      '[Strategy] Getting current report {} for strategy {}. TxHash: {}',
      [currentReportId ? currentReportId : 'null', strategy.id, txHash]
    );
    let latestReport = strategyReportLibrary.getOrCreate(
      transaction.id,
      strategy as Strategy,
      gain,
      loss,
      currentDebt,
      protocolFees,
      totalFees,
      totalRefunds,
      event
    );
    strategy.latestReport = latestReport.id;
    strategy.save();

    // Getting latest report to compare to the new one and create a new report result.
    if (currentReportId !== null) {
      let currentReport = StrategyReport.load(currentReportId);
      if (currentReport !== null) {
        log.info(
          '[Strategy] Create report result (latest {} vs current {}) for strategy {}. TxHash: {}',
          [latestReport.id, currentReport.id, strategyId, txHash]
        );
        strategyReportResultLibrary.create(
          transaction,
          currentReport as StrategyReport,
          latestReport
        );
      }
      } else {
        log.info(
          '[Strategy] Report result NOT created. Only one report created {} for strategy {}. TxHash: {}',
          [latestReport.id, strategyId, txHash]
        );
      }
    return latestReport;
  } else {
    log.warning(
      '[Strategy] Failed to load strategy {} while handling StrategyReport',
      [strategyId]
    );
    return null;
  }
}

export function updateDebt(
  vaultAddress: Address,
  strategyAddress: Address,
  newDebt: BigInt,
  transaction: Transaction
): void {
  let strategyId = buildId(strategyAddress);
  let txHash = transaction.hash.toHexString();
  log.info(
    '[Strategy Mapping] Update Debt for strategy {} tx {}',
    [strategyId, txHash]
  );

  let vaultId = vaultAddress.toHexString();
  let vault = Vault.load(vaultId);
  if (!vault) {
    log.critical(
      '[Strategy Mapping] Vault entity does not exist: {} updateDebt tx {}',
      [vaultId, txHash]
    );
    return;
  }

  let strategy = Strategy.load(strategyId);
  if (!strategy) {
    log.critical(
      '[Strategy Mapping] Strategy entity does not exist: {} updateDebt tx {}',
      [strategyId, txHash]
    );
    return;
  }

  if (strategy.vault != vaultId) {
    log.critical(
      '[Strategy Mapping] Strategy entity {} is not linked to this vault: {} tx: {}',
      [strategyId, vaultId, txHash]
    );
    return;
  }

  strategy.currentDebt = newDebt;
  strategy.save();
}

export function updateMaxDebt(
    vaultAddress: Address,
    strategyAddress: Address,
    newDebt: BigInt,
    transaction: Transaction
  ): void {
    let strategyId = buildId(strategyAddress);
    let txHash = transaction.hash.toHexString();
    log.info(
      '[Strategy Mapping] Update Max Debt for strategy {} tx {}',
      [strategyId, txHash]
    );
  
    let vaultId = vaultAddress.toHexString();
    let vault = Vault.load(vaultId);
    if (!vault) {
      log.critical(
        '[Strategy Mapping] Vault entity does not exist: {} updateMaxDebt tx {}',
        [vaultId, txHash]
      );
      return;
    }
  
    let strategy = Strategy.load(strategyId);
    if (!strategy) {
      log.critical(
        '[Strategy Mapping] Strategy entity does not exist: {} updateMaxDebt tx {}',
        [strategyId, txHash]
      );
      return;
    }
  
    if (strategy.vault != vaultId) {
      log.critical(
        '[Strategy Mapping] Strategy entity {} is not linked to this vault: {} tx: {}',
        [strategyId, vaultId, txHash]
      );
      return;
    }
  
    strategy.maxDebt = newDebt;
    strategy.save();
  }

export function updateDebtPurchased(
  vaultAddress: Address,
  strategyAddress: Address,
  amount: BigInt,
  transaction: Transaction
): void {
  let strategyId = buildId(strategyAddress);
  let txHash = transaction.hash.toHexString();
  log.info(
    '[Strategy Mapping] Update Debt Purchased for strategy {} tx {}',
    [strategyId, txHash]
  );

  let vaultId = vaultAddress.toHexString();
  let vault = Vault.load(vaultId);
  if (!vault) {
    log.critical(
      '[Strategy Mapping] Vault entity does not exist: {} update debt purchased tx {}',
      [vaultId, txHash]
    );
    return;
  }

  let strategy = Strategy.load(strategyId);
  if (!strategy) {
    log.critical(
      '[Strategy Mapping] Strategy entity does not exist: {} update debt purchased tx {}',
      [strategyId, txHash]
    );
    return;
  }

  if (strategy.vault != vaultId) {
    log.critical(
      '[Strategy Mapping] Strategy entity {} is not linked to this vault: {} tx: {}',
      [strategyId, vaultId, txHash]
    );
    return;
  }

  strategy.currentDebt = strategy.currentDebt.minus(amount);
  vault.totalDebtAmount = vault.totalDebtAmount.minus(amount);
  vault.totalIdleAmount = vault.totalIdleAmount.plus(amount);
  strategy.save();
  vault.save();
}