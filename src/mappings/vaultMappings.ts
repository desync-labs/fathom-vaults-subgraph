import { log } from "@graphprotocol/graph-ts"
import {
  RoleSet,
  UpdateRoleManager,
  DebtPurchased,
} from "../../generated/FathomVault/FathomVault"
  import {
    getOrCreateTransactionFromEvent,
  } from '../utils/transaction';
  import * as strategyLibrary from '../utils/strategy/strategy';
  import * as vaultLibrary from '../utils/vault/vault';
  import * as accountLibrary from '../utils/account/account';

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

  vaultLibrary.updateRoleManager(
    event.address,
    event.params.roleManager,
    ethTransaction
  );
}

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