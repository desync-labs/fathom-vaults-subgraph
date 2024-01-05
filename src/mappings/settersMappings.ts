import { Address, log } from "@graphprotocol/graph-ts"
import {
  UpdatedAccountant,
  UpdatedDefaultQueue,
  UpdatedUseDefaultQueue,
  UpdatedDepositLimit,
  UpdatedMinimumTotalIdle,
  UpdatedProfitMaxUnlockTime,
  UpdatedDepositLimitModule,
  UpdatedWithdrawLimitModule
} from "../../generated/FathomVault/VaultPackage"
import {
  getOrCreateTransactionFromEvent,
} from '../utils/transaction';
import * as vaultLibrary from '../utils/vault/vault';
import { addresses } from "../../config/addresses";

// Constant for the FathomVault contract address
const FATHOM_VAULT_ADDRESS = Address.fromString(addresses.FathomVault)

export function handleUpdatedAccountant(event: UpdatedAccountant): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedAccountant'
  );

  vaultLibrary.UpdatedAccountant(
    FATHOM_VAULT_ADDRESS,
    event.params.accountant,
    ethTransaction
  );
}

export function handleUpdatedDefaultQueue(event: UpdatedDefaultQueue): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedDefaultQueue'
  );

  vaultLibrary.UpdatedDefaultQueue(event.params.newDefaultQueue, ethTransaction, event);
}

export function handleUpdatedUseDefaultQueue(event: UpdatedUseDefaultQueue): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedUseDefaultQueue'
  );

  vaultLibrary.UpdatedUseDefaultQueue(event.params.useDefaultQueue, ethTransaction, event);
}

export function handleUpdatedDepositLimit(event: UpdatedDepositLimit): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedDepositLimit'
  );

  vaultLibrary.UpdatedDepositLimit(
    FATHOM_VAULT_ADDRESS,
    event.params.depositLimit,
    ethTransaction
  );
}

export function handleUpdatedMinimumTotalIdle(event: UpdatedMinimumTotalIdle): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedMinimumTotalIdle'
  );

  vaultLibrary.UpdatedMinimumTotalIdle(
    FATHOM_VAULT_ADDRESS,
    event.params.minimumTotalIdle,
    ethTransaction
  );
}

export function handleUpdatedProfitMaxUnlockTime(event: UpdatedProfitMaxUnlockTime): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedProfitMaxUnlockTime'
  );

  vaultLibrary.UpdatedProfitMaxUnlockTime(
    FATHOM_VAULT_ADDRESS,
    event.params.profitMaxUnlockTime,
    ethTransaction
  );
}

export function handleUpdatedDepositLimitModule(event: UpdatedDepositLimitModule): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedDepositLimitModule'
  );

  vaultLibrary.UpdatedDepositLimitModule(
    FATHOM_VAULT_ADDRESS,
    event.params.depositLimitModule,
    ethTransaction
  );
}

export function handleUpdatedWithdrawLimitModule(event: UpdatedWithdrawLimitModule): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'WithdrawDepositLimitModule'
  );

  vaultLibrary.UpdatedWithdrawLimitModule(
    FATHOM_VAULT_ADDRESS,
    event.params.withdrawLimitModule,
    ethTransaction
  );
}