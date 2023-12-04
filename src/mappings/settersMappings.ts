import { Address, log } from "@graphprotocol/graph-ts"
import {
  UpdateAccountant,
  UpdateDefaultQueue,
  UpdateUseDefaultQueue,
  UpdateDepositLimit,
  UpdateMinimumTotalIdle,
  UpdateProfitMaxUnlockTime,
  UpdateDepositLimitModule,
  UpdateWithdrawLimitModule
} from "../../generated/FathomVault/FathomVault"
  import {
    getOrCreateTransactionFromEvent,
  } from '../utils/transaction';
  import * as vaultLibrary from '../utils/vault/vault';

// Constant for the FathomVault contract address
const FATHOM_VAULT_ADDRESS = Address.fromString("0xc06c2985607E12FAeD88733Af7891D3827E4E1b3");

export function handleUpdateAccountant(event: UpdateAccountant): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdateAccountant'
  );

  vaultLibrary.updateRoleManager(
    FATHOM_VAULT_ADDRESS,
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

export function handleUpdateDepositLimit(event: UpdateDepositLimit): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdateDepositLimit'
  );

  vaultLibrary.updateDepositLimit(
    FATHOM_VAULT_ADDRESS,
    event.params.depositLimit,
    ethTransaction
  );
}

export function handleUpdateMinimumTotalIdle(event: UpdateMinimumTotalIdle): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdateMinimumTotalIdle'
  );

  vaultLibrary.updateMinimumTotalIdle(
    FATHOM_VAULT_ADDRESS,
    event.params.minimumTotalIdle,
    ethTransaction
  );
}

export function handleUpdateProfitMaxUnlockTime(event: UpdateProfitMaxUnlockTime): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdateProfitMaxUnlockTime'
  );

  vaultLibrary.updateProfitMaxUnlockTime(
    FATHOM_VAULT_ADDRESS,
    event.params.profitMaxUnlockTime,
    ethTransaction
  );
}

export function handleUpdateDepositLimitModule(event: UpdateDepositLimitModule): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdateDepositLimitModule'
  );

  vaultLibrary.updateDepositLimitModule(
    FATHOM_VAULT_ADDRESS,
    event.params.depositLimitModule,
    ethTransaction
  );
}

export function handleUpdateWithdrawLimitModule(event: UpdateWithdrawLimitModule): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'WithdrawDepositLimitModule'
  );

  vaultLibrary.updateWithdrawLimitModule(
    FATHOM_VAULT_ADDRESS,
    event.params.withdrawLimitModule,
    ethTransaction
  );
}