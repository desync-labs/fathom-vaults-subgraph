import { Address, log } from "@graphprotocol/graph-ts";
import {
  DebtPurchased,
  DebtUpdated,
  UpdatedDepositLimit,
  StrategyChanged,
  StrategyReported,
  UpdatedMaxDebtForStrategy,
  Transfer,
  Deposit,
  Withdraw,
  UpdatedAccountant,
  UpdatedDefaultQueue,
  UpdatedUseDefaultQueue,
  UpdatedMinimumTotalIdle,
  UpdatedProfitMaxUnlockTime,
  UpdatedDepositLimitModule,
  UpdatedWithdrawLimitModule,
  Shutdown,
  VaultPackage
} from "../../generated/templates/FathomVault/VaultPackage";
import { StrategyReport } from "../../generated/schema";
import {
  getOrCreateTransactionFromEvent,
} from '../utils/transaction';
import * as strategyLibrary from '../utils/strategy/strategy';
import * as vaultLibrary from '../utils/vault/vault';
import { fromSharesToAmount } from '../utils/commons';
import { ZERO_ADDRESS, BIGINT_ZERO } from '../utils/constants';

// Vault management

export function handleDebtPurchased(event: DebtPurchased): void {
  log.info('[Vault mappings] Handle debt purchased', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'DebtPurchased'
  );

  strategyLibrary.updateDebtPurchased(
    event.address,
    event.params.strategy,
    event.params.amount,
    ethTransaction
  );
}

export function handleDebtUpdated(event: DebtUpdated): void {
  log.info('[Vault mappings] Handle debt updated', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'DebtUpdated'
  );

  strategyLibrary.updateDebt(
    event.address,
    event.params.strategy,
    event.params.newDebt,
    ethTransaction
  );
}

export function handleUpdatedDepositLimit(event: UpdatedDepositLimit): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedDepositLimit'
  );

  vaultLibrary.updateDepositLimit(
    event.address,
    event.params.depositLimit,
    ethTransaction
  );
}

// Strategy management

export function handleStrategyChanged(event: StrategyChanged): void {
  log.info('[Vault mappings] Handle strategy changed', []);
  let transaction = getOrCreateTransactionFromEvent(
    event,
    'StrategyChanged'
  );

  if (event.params.changeType == 0) {
    strategyLibrary.createAndGet(
      transaction.id,
      event.params.strategy,
      event.address,
      BIGINT_ZERO,
      BIGINT_ZERO,
      transaction,
    );
  } else if (event.params.changeType == 1) {
    strategyLibrary.remove(
      event.params.strategy,
      event.address,
      transaction
    );
  }
}

export function handleStrategyReported(event: StrategyReported): void {
  log.info('[Vault mappings] Handle strategy reported', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'StrategyReported'
  );

  let strategyReport = strategyLibrary.createReport(
    ethTransaction,
    event.params.strategy.toHexString(),
    event.params.gain,
    event.params.loss,
    event.params.currentDebt,
    event.params.protocolFees,
    event.params.totalFees,
    event.params.totalRefunds,
    event
  );
  let vaultContractAddress = event.address;
  if (!strategyReport) {
    log.warning(
      '[Vault mappings] Strategy report NOT created. Handler is finishing. TxHash: {} - Strategy: {} - Vault: {}',
      [
        event.transaction.hash.toHexString(),
        event.params.strategy.toHexString(),
        vaultContractAddress.toHexString(),
      ]
    );
    return;
  }

  log.info(
    '[Vault mappings] Updating price per share (strategy reported): {}',
    [event.transaction.hash.toHexString()]
  );
  let vaultContract = VaultPackage.bind(vaultContractAddress);
  vaultLibrary.strategyReported(
    ethTransaction,
    strategyReport as StrategyReport,
    vaultContract,
    vaultContractAddress,
    event.block.timestamp,
    event.block.number
  );
}

export function handleUpdatedMaxDebtForStrategy(event: UpdatedMaxDebtForStrategy): void {
  log.info('[Vault mappings] Handle max debt updated', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedMaxDebtForStrategy'
  );

  strategyLibrary.updateMaxDebt(
    event.address,
    event.params.strategy,
    event.params.newDebt,
    ethTransaction
  );
}

// Shares management

export function handleTransfer(event: Transfer): void {
  log.info('[Vault mappings] Handle transfer: From: {} - To: {}. TX hash: {}', [
    event.params.from.toHexString(),
    event.params.to.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
  if (
    event.params.from.toHexString() != ZERO_ADDRESS &&
    event.params.to.toHexString() != ZERO_ADDRESS
  ) {
    if (!vaultLibrary.isVault(event.address)) {
      log.info(
        '[Transfer] Transfer {} is not on behalf of a vault entity. Not processing.',
        [event.transaction.hash.toHexString()]
      );
      return;
    }

    log.info(
      '[Vault mappings] Processing transfer: Vault: {} From: {} - To: {}. TX hash: {}',
      [
        event.address.toHexString(),
        event.params.from.toHexString(),
        event.params.to.toHexString(),
        event.transaction.hash.toHexString(),
      ]
    );
    let transaction = getOrCreateTransactionFromEvent(
      event,
      'Transfer'
    );
    let vaultContract = VaultPackage.bind(event.address);
    let totalAssets = vaultLibrary.getTotalAssets(event.address);
    let totalSupply = vaultContract.totalSupply();
    let sharesAmount = event.params.value;
    let amount = fromSharesToAmount(sharesAmount, totalAssets, totalSupply);
    // share  = (amount * totalSupply) / totalAssets
    // amount = (shares * totalAssets) / totalSupply
    vaultLibrary.transfer(
      vaultContract,
      event.params.from,
      event.params.to,
      amount,
      vaultContract.asset(),
      sharesAmount,
      event.address,
      transaction
    );
  } else {
    log.info(
      '[Vault mappings] Not processing transfer: From: {} - To: {}. TX hash: {}',
      [
        event.params.from.toHexString(),
        event.params.to.toHexString(),
        event.transaction.hash.toHexString(),
      ]
    );
  }
}

export function handleDeposit(event: Deposit): void {
  log.info('[Vault mappings] Handle deposit', []);

  let transaction = getOrCreateTransactionFromEvent(event, 'Deposit');

  let amount = event.params.assets;
  let sharesMinted = event.params.shares;
  let recipient = event.params.owner;
  let vaultAddress = event.address;

  log.info('[Vault mappings] Handle deposit shares {} - amount {}', [
    sharesMinted.toString(),
    amount.toString(),
  ]);

  log.info('[Vault mappings] VAULT DEPLOYED: {}', [vaultAddress.toHexString()]);

  vaultLibrary.deposit(
    vaultAddress,
    transaction,
    recipient,
    amount,
    sharesMinted,
    event.block.timestamp,
    event.block.number
  );
}

export function handleWithdraw(event: Withdraw): void {
  log.debug('[Vault mappings] Handle withdraw', []);

  let transaction = getOrCreateTransactionFromEvent(event, 'Withdraw');

  let amount = event.params.assets;
  let sharesBurnt = event.params.shares;
  let recipient = event.params.receiver;
  let vaultAddress = event.address;

  log.info('[Vault mappings] Handle withdraw shares {} - amount {}', [
    sharesBurnt.toString(),
    amount.toString(),
  ]);

  vaultLibrary.withdraw(
    vaultAddress,
    recipient,
    amount,
    sharesBurnt,
    transaction,
    event.block.timestamp,
    event.block.number
  );
}

// Vault configuration

export function handleUpdatedAccountant(event: UpdatedAccountant): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedAccountant'
  );

  vaultLibrary.updateAccountant(
    event.address,
    event.params.accountant,
    ethTransaction
  );
}

export function handleUpdatedDefaultQueue(event: UpdatedDefaultQueue): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedDefaultQueue'
  );

  vaultLibrary.updateDefaultQueue(event.params.newDefaultQueue, ethTransaction, event);
}

export function handleUpdatedUseDefaultQueue(event: UpdatedUseDefaultQueue): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedUseDefaultQueue'
  );

  vaultLibrary.updateUseDefaultQueue(event.params.useDefaultQueue, ethTransaction, event);
}

export function handleUpdatedMinimumTotalIdle(event: UpdatedMinimumTotalIdle): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedMinimumTotalIdle'
  );

  vaultLibrary.updateMinimumTotalIdle(
    event.address,
    event.params.minimumTotalIdle,
    ethTransaction
  );
}

export function handleUpdatedProfitMaxUnlockTime(event: UpdatedProfitMaxUnlockTime): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedProfitMaxUnlockTime'
  );

  vaultLibrary.updateProfitMaxUnlockTime(
    event.address,
    event.params.profitMaxUnlockTime,
    ethTransaction
  );
}

export function handleUpdatedDepositLimitModule(event: UpdatedDepositLimitModule): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedDepositLimitModule'
  );

  vaultLibrary.updateDepositLimitModule(
    event.address,
    event.params.depositLimitModule,
    ethTransaction
  );
}

export function handleUpdatedWithdrawLimitModule(event: UpdatedWithdrawLimitModule): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedWithdrawLimitModule'
  );

  vaultLibrary.updateWithdrawLimitModule(
    event.address,
    event.params.withdrawLimitModule,
    ethTransaction
  );
}

// Governance

export function handleShutdown(event: Shutdown): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'Shutdown'
  );

  vaultLibrary.shutdown(
    event.address,
    ethTransaction
  );
}