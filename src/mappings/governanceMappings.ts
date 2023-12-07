import { Address, log } from "@graphprotocol/graph-ts"
import {
  DebtUpdated,
  UpdateDepositLimit,
  DebtPurchased,
  Shutdown,
  UpdateDepositLimitModule,
  UpdateWithdrawLimitModule,
  FathomVault
} from "../../generated/FathomVault/FathomVault"
  import {
    getOrCreateTransactionFromEvent,
  } from '../utils/transaction';
  import * as strategyLibrary from '../utils/strategy/strategy';
  import * as vaultLibrary from '../utils/vault/vault';

// Constant for the FathomVault contract address
const FATHOM_VAULT_ADDRESS = Address.fromString("0x64a472B648C67ED33913f166FdDCC63130c5032d");

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