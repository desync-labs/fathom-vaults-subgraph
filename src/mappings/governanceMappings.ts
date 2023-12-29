import { Address, log } from "@graphprotocol/graph-ts"
import {
  DebtUpdated,
  UpdatedDepositLimit,
  DebtPurchased,
  Shutdown,
  UpdatedDepositLimitModule,
  UpdatedWithdrawLimitModule,
  VaultPackage
} from "../../generated/FathomVault/VaultPackage"
import {
  getOrCreateTransactionFromEvent,
} from '../utils/transaction';
import * as strategyLibrary from '../utils/strategy/strategy';
import * as vaultLibrary from '../utils/vault/vault';
import { addresses } from "../../config/addresses";

// Constant for the FathomVault contract address
const FATHOM_VAULT_ADDRESS = Address.fromString(addresses.FathomVault);

export function handleDebtUpdated(event: DebtUpdated): void {
  log.info('[Governance mappings] Handle debt updated', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'DebtUpdated'
  );

  strategyLibrary.updateDebt(
    FATHOM_VAULT_ADDRESS,
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

  vaultLibrary.UpdatedDepositLimit(
    FATHOM_VAULT_ADDRESS,
    event.params.depositLimit,
    ethTransaction
  );
}

export function handleDebtPurchased(event: DebtPurchased): void {
  log.info('[Governance mappings] Handle debt purchased', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'DebtPurchased'
  );

  strategyLibrary.updateDebtPurchased(
    FATHOM_VAULT_ADDRESS,
    event.params.strategy,
    event.params.amount,
    ethTransaction
  );
}

export function handleShutdown(event: Shutdown): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'Shutdown'
  );

  vaultLibrary.shutdown(
    FATHOM_VAULT_ADDRESS,
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