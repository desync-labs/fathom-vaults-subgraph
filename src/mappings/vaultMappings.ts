import { log } from "@graphprotocol/graph-ts"
import {
  DebtPurchased,
} from "../../generated/FathomVault/VaultPackage"
import {
  getOrCreateTransactionFromEvent,
} from '../utils/transaction';
import * as strategyLibrary from '../utils/strategy/strategy';
import * as vaultLibrary from '../utils/vault/vault';
import * as accountLibrary from '../utils/account/account';

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