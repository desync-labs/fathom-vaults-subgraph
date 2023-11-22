import { BigInt, log } from "@graphprotocol/graph-ts"
import {
  // StrategyChanged,
  // StrategyReported,
  // DebtUpdated,
  // RoleSet,
  // RoleStatusChanged,
  // UpdateRoleManager,
  // UpdateAccountant,
  // UpdateDefaultQueue,
  // UpdateUseDefaultQueue,
  // UpdatedMaxDebtForStrategy,
  // UpdateDepositLimit,
  // UpdateMinimumTotalIdle,
  // UpdateProfitMaxUnlockTime,
  // DebtPurchased,
  // Shutdown,
  // UpdateDepositLimitModule,
  // UpdateWithdrawLimitModule,
  // Transfer,
  // Approval,
  Deposit,
  // Withdraw,
  // FathomVault
} from "../generated/FathomVault/FathomVault"
 import { 
  //Transaction,
//   Token,
//   Vault,
//   VaultUpdate,
//   Account,
//   Deposit as DepositEntity,
//   Withdrawal,
//   Transfer as TransferEntity,
//   AccountVaultPosition,
//   AccountVaultPositionUpdate,
//   Strategy,
//   StrategyReport,
//   StrategyReportResult,
//   VaultDayData } from "../../generated/schema"
//   import {
//    getOrCreateTransactionFromCall,
     getOrCreateTransactionFromEvent,
  } from './utils/transaction';
  // import { BIGINT_ZERO, BIGINT_MAX, ZERO_ADDRESS } from '../utils/constants';
  // import * as strategyLibrary from '../utils/strategy/strategy';
  import * as vaultLibrary from './utils/vault/vault';
  // import * as accountLibrary from '../utils/account/account';
  // import { fromSharesToAmount, printCallInfo } from '../utils/commons';

// export function handleStrategyChanged(event: StrategyChanged): void {
//   log.info('[Vault mappings] Handle strategy changed', []);
//   let transaction = getOrCreateTransactionFromEvent(
//     event,
//     'StrategyChanged'
//   );
//   strategyLibrary.createAndGet(
//     transaction.id,
//     event.params.strategy,
//     event.address,
//     BIGINT_ZERO,
//     BIGINT_ZERO,
//     transaction,
//   );
// }

// export function handleStrategyReported(event: StrategyReported): void {
//   log.info('[Vault mappings] Handle strategy reported', []);
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'StrategyReported'
//   );

//   let strategyReport = strategyLibrary.createReport(
//     ethTransaction,
//     event.params.strategy.toHexString(),
//     event.params.gain,
//     event.params.loss,
//     event.params.currentDebt,
//     event.params.protocolFees,
//     event.params.totalFees,
//     event.params.totalRefunds,
//     event
//   );
//   let vaultContractAddress = event.address;
//   if (!strategyReport) {
//     log.warning(
//       '[Vault mappings] Strategy report NOT created. Handler is finishing. TxHash: {} - Strategy: {} - Vault: {}',
//       [
//         event.transaction.hash.toHexString(),
//         event.params.strategy.toHexString(),
//         vaultContractAddress.toHexString(),
//       ]
//     );
//     return;
//   }

//   log.info(
//     '[Vault mappings] Updating price per share (strategy reported): {}',
//     [event.transaction.hash.toHexString()]
//   );
//   let vaultContract = FathomVault.bind(vaultContractAddress);
//   vaultLibrary.strategyReported(
//     ethTransaction,
//     strategyReport as StrategyReport,
//     vaultContract,
//     vaultContractAddress,
//     event.block.timestamp,
//     event.block.number
//   );
// }

// export function handleDebtUpdated(event: DebtUpdated): void {
//   log.info('[Vault mappings] Handle debt updated', []);
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'DebtUpdated'
//   );

//   strategyLibrary.updateDebt(
//     event.address,
//     event.params.strategy,
//     event.params.newDebt,
//     ethTransaction
//   );
// }

// export function handleRoleSet(event: RoleSet): void {
//   log.info('[Vault mappings] Handle role set', []);
//   accountLibrary.setRole(
//     event.params.account,
//     event.params.role
//   );
// }

// export function handleUpdateRoleManager(event: UpdateRoleManager): void {
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'UpdateRoleManager'
//   );

//   vaultLibrary.updateRoleManager(
//     event.address,
//     event.params.roleManager,
//     ethTransaction
//   );
// }

// export function handleUpdateAccountant(event: UpdateAccountant): void {
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'UpdateAccountant'
//   );

//   vaultLibrary.updateRoleManager(
//     event.address,
//     event.params.accountant,
//     ethTransaction
//   );
// }

// export function handleUpdateDefaultQueue(event: UpdateDefaultQueue): void {
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'UpdateDefaultQueue'
//   );

//   vaultLibrary.UpdateDefaultQueue(event.params.newDefaultQueue, ethTransaction, event);
// }

// export function handleUpdateUseDefaultQueue(event: UpdateUseDefaultQueue): void {
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'UpdateUseDefaultQueue'
//   );

//   vaultLibrary.UpdateUseDefaultQueue(event.params.useDefaultQueue, ethTransaction, event);
// }

// export function handleUpdatedMaxDebtForStrategy(event: UpdatedMaxDebtForStrategy): void {
//   log.info('[Vault mappings] Handle max debt updated', []);
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'UpdatedMaxDebtForStrategy'
//   );

//   strategyLibrary.updateMaxDebt(
//     event.address,
//     event.params.strategy,
//     event.params.newDebt,
//     ethTransaction
//   );
// }

// export function handleUpdateDepositLimit(event: UpdateDepositLimit): void {
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'UpdateDepositLimit'
//   );

//   vaultLibrary.updateDepositLimit(
//     event.address,
//     event.params.depositLimit,
//     ethTransaction
//   );
// }

// export function handleUpdateMinimumTotalIdle(event: UpdateMinimumTotalIdle): void {
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'UpdateMinimumTotalIdle'
//   );

//   vaultLibrary.updateMinimumTotalIdle(
//     event.address,
//     event.params.minimumTotalIdle,
//     ethTransaction
//   );
// }

// export function handleUpdateProfitMaxUnlockTime(event: UpdateProfitMaxUnlockTime): void {
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'UpdateProfitMaxUnlockTime'
//   );

//   vaultLibrary.updateProfitMaxUnlockTime(
//     event.address,
//     event.params.profitMaxUnlockTime,
//     ethTransaction
//   );
// }

// export function handleDebtPurchased(event: DebtPurchased): void {
//   log.info('[Vault mappings] Handle debt purchased', []);
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'DebtPurchased'
//   );

//   strategyLibrary.updateDebtPurchased(
//     event.address,
//     event.params.strategy,
//     event.params.amount,
//     ethTransaction
//   );
// }

// export function handleShutdown(event: Shutdown): void {
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'Shutdown'
//   );

//   vaultLibrary.shutdown(
//     event.address,
//     ethTransaction
//   );
// }

// export function handleUpdateDepositLimitModule(event: UpdateDepositLimitModule): void {
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'UpdateDepositLimitModule'
//   );

//   vaultLibrary.updateDepositLimitModule(
//     event.address,
//     event.params.depositLimitModule,
//     ethTransaction
//   );
// }

// export function handleUpdateWithdrawLimitModule(event: UpdateWithdrawLimitModule): void {
//   let ethTransaction = getOrCreateTransactionFromEvent(
//     event,
//     'WithdrawDepositLimitModule'
//   );

//   vaultLibrary.updateWithdrawLimitModule(
//     event.address,
//     event.params.withdrawLimitModule,
//     ethTransaction
//   );
// }

// export function handleTransfer(event: Transfer): void {
//   log.info('[Vault mappings] Handle transfer: From: {} - To: {}. TX hash: {}', [
//     event.params.from.toHexString(),
//     event.params.to.toHexString(),
//     event.transaction.hash.toHexString(),
//   ]);
//   if (
//     event.params.from.toHexString() != ZERO_ADDRESS &&
//     event.params.to.toHexString() != ZERO_ADDRESS
//   ) {
//     if (!vaultLibrary.isVault(event.address)) {
//       log.info(
//         '[Transfer] Transfer {} is not on behalf of a vault entity. Not processing.',
//         [event.transaction.hash.toHexString()]
//       );
//       return;
//     }

//     log.info(
//       '[Vault mappings] Processing transfer: Vault: {} From: {} - To: {}. TX hash: {}',
//       [
//         event.address.toHexString(),
//         event.params.from.toHexString(),
//         event.params.to.toHexString(),
//         event.transaction.hash.toHexString(),
//       ]
//     );
//     let transaction = getOrCreateTransactionFromEvent(
//       event,
//       'Transfer'
//     );
//     let vaultContract = FathomVault.bind(event.address);
//     let totalAssets = vaultLibrary.getTotalAssets(event.address);
//     let totalSupply = vaultContract.totalSupply();
//     let sharesAmount = event.params.value;
//     let amount = fromSharesToAmount(sharesAmount, totalAssets, totalSupply);
//     // share  = (amount * totalSupply) / totalAssets
//     // amount = (shares * totalAssets) / totalSupply
//     vaultLibrary.transfer(
//       vaultContract,
//       event.params.from,
//       event.params.to,
//       amount,
//       vaultContract.ASSET(),
//       sharesAmount,
//       event.address,
//       transaction
//     );
//   } else {
//     log.info(
//       '[Vault mappings] Not processing transfer: From: {} - To: {}. TX hash: {}',
//       [
//         event.params.from.toHexString(),
//         event.params.to.toHexString(),
//         event.transaction.hash.toHexString(),
//       ]
//     );
//   }
// }

export function handleDeposit(event: Deposit): void {
  log.debug('[Vault mappings] Handle deposit', []);

  let transaction = getOrCreateTransactionFromEvent(event, 'Deposit');

  let amount = event.params.assets;
  let sharesMinted = event.params.shares;
  let recipient = event.params.owner;
  let vaultAddress = event.address;

  log.info('[Vault mappings] Handle deposit shares {} - amount {}', [
    sharesMinted.toString(),
    amount.toString(),
  ]);

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

// export function handleWithdraw(event: Withdraw): void {
//   log.debug('[Vault mappings] Handle withdraw', []);

//   let transaction = getOrCreateTransactionFromEvent(event, 'Withdraw');

//   let amount = event.params.assets;
//   let sharesBurnt = event.params.shares;
//   let recipient = event.params.receiver;
//   let vaultAddress = event.address;

//   log.info('[Vault mappings] Handle withdraw shares {} - amount {}', [
//     sharesBurnt.toString(),
//     amount.toString(),
//   ]);

//   vaultLibrary.withdraw(
//     vaultAddress,
//     recipient,
//     amount,
//     sharesBurnt,
//     transaction,
//     event.block.timestamp,
//     event.block.number
//   );
// }
