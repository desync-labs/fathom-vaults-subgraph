import { BigInt, log } from "@graphprotocol/graph-ts"
import {
  StrategyChanged,
  StrategyReported,
  DebtUpdated,
  RoleSet,
  RoleStatusChanged,
  UpdateRoleManager,
  UpdateAccountant,
  UpdateDefaultQueue,
  UpdateUseDefaultQueue,
  UpdatedMaxDebtForStrategy,
  UpdateDepositLimit,
  UpdateMinimumTotalIdle,
  UpdateProfitMaxUnlockTime,
  DebtPurchased,
  Shutdown,
  UpdateDepositLimitModule,
  UpdateWithdrawLimitModule,
  Transfer,
  Approval,
  Deposit,
  Withdraw,
  FathomVault
} from "../../generated/FathomVault/FathomVault"
import { Transaction,
  Token,
  Vault,
  VaultUpdate,
  Account,
  Deposit as DepositEntity,
  Withdrawal,
  Transfer as TransferEntity,
  AccountVaultPosition,
  AccountVaultPositionUpdate,
  Strategy,
  StrategyReport,
  StrategyReportResult,
  VaultDayData } from "../../generated/schema"
  import {
    getOrCreateTransactionFromCall,
    getOrCreateTransactionFromEvent,
  } from '../utils/transaction';
  import { BIGINT_ZERO, BIGINT_MAX, ZERO_ADDRESS } from '../utils/constants';
  import * as strategyLibrary from '../utils/strategy/strategy';
  import * as vaultLibrary from '../utils/vault/vault';
  import * as accountLibrary from '../utils/account/account';

export function handleStrategyChanged(event: StrategyChanged): void {
  log.info('[Vault mappings] Handle strategy changed', []);
  let transaction = getOrCreateTransactionFromEvent(
    event,
    'StrategyChanged'
  );
  strategyLibrary.createAndGet(
    transaction.id,
    event.params.strategy,
    event.address,
    BIGINT_ZERO,
    BIGINT_ZERO,
    transaction,
  );
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
  let vaultContract = FathomVault.bind(vaultContractAddress);
  vaultLibrary.strategyReported(
    ethTransaction,
    strategyReport,
    vaultContract,
    vaultContractAddress
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

export function handleRoleSet(event: RoleSet): void {
  log.info('[Vault mappings] Handle role set', []);
  accountLibrary.setRole(
    event.params.account,
    event.params.role
  );
}

export function handleUpdateRoleManager(event: UpdateRoleManager): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdateRoleManager'
  );

  vaultLibrary.handleUpdateRoleManager(
    event.address,
    event.params.roleManager,
    ethTransaction
  );
}

export function handleUpdateAccountant(event: UpdateAccountant): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdateAccountant'
  );

  vaultLibrary.handleUpdateRoleManager(
    event.address,
    event.params.accountant,
    ethTransaction
  );
}

export function handleUpdateDefaultQueue(event: UpdateDefaultQueue): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdateDefaultQueue'
  );

  vaultLibrary.UpdateDefaultQueue(event.params.newDefaultQueue, ethTransaction, event);
}

export function handleUpdateUseDefaultQueue(event: UpdateUseDefaultQueue): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdateUseDefaultQueue'
  );

  vaultLibrary.UpdateUseDefaultQueue(event.params.useDefaultQueue, ethTransaction, event);
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

export function handleUpdateDepositLimit(event: UpdateDepositLimit): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdateDepositLimit'
  );

  vaultLibrary.handleUpdateDepositLimit(
    event.address,
    event.params.depositLimit,
    ethTransaction
  );
}

export function handleUpdateMinimumTotalIdle(event: UpdateMinimumTotalIdle): void {
  // Implementation
}

export function handleUpdateProfitMaxUnlockTime(event: UpdateProfitMaxUnlockTime): void {
  // Implementation
}

export function handleDebtPurchased(event: DebtPurchased): void {
  // Implementation
}

export function handleShutdown(event: Shutdown): void {
  // Implementation
}

export function handleUpdateDepositLimitModule(event: UpdateDepositLimitModule): void {
  // Implementation
}

export function handleUpdateWithdrawLimitModule(event: UpdateWithdrawLimitModule): void {
  // Implementation
}

export function handleTransfer(event: Transfer): void {
  // Implementation
}

export function handleApproval(event: Approval): void {
  // Implementation
}

export function handleDeposit(event: Deposit): void {
  // Implementation
}

export function handleWithdraw(event: Withdraw): void {
  // Implementation
}
