import { Address, log } from "@graphprotocol/graph-ts"
import {
  StrategyChanged,
  StrategyReported,
  DebtUpdated,
  UpdatedMaxDebtForStrategy,
  VaultPackage,
  UpdatedFees
} from "../../generated/FathomVault/VaultPackage"
import { StrategyReport } from "../../generated/schema"
import {
  getOrCreateTransactionFromEvent,
} from '../utils/transaction';
import { BIGINT_ZERO } from '../utils/constants';
import * as strategyLibrary from '../utils/strategy/strategy';
import * as vaultLibrary from '../utils/vault/vault';
import { addresses } from "../../config/addresses";

// Constant for the FathomVault contract address
const FATHOM_VAULT_ADDRESS = Address.fromString(addresses.FathomVault)

export function handleStrategyChanged(event: StrategyChanged): void {
  log.info('[Strategy Manager mappings] Handle strategy changed', []);
  let transaction = getOrCreateTransactionFromEvent(
    event,
    'StrategyChanged'
  );
  strategyLibrary.createAndGet(
    transaction.id,
    event.params.strategy,
    FATHOM_VAULT_ADDRESS,
    BIGINT_ZERO,
    BIGINT_ZERO,
    transaction,
  );
}

export function handleStrategyReported(event: StrategyReported): void {
  log.info('[Strategy Manager mappings] Handle strategy reported', []);
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
  let vaultContractAddress = FATHOM_VAULT_ADDRESS;
  if (!strategyReport) {
    log.warning(
      '[Strategy Manager mappings] Strategy report NOT created. Handler is finishing. TxHash: {} - Strategy: {} - Vault: {}',
      [
        event.transaction.hash.toHexString(),
        event.params.strategy.toHexString(),
        vaultContractAddress.toHexString(),
      ]
    );
    return;
  }

  log.info(
    '[Strategy Manager mappings] Updating price per share (strategy reported): {}',
    [event.transaction.hash.toHexString()]
  );
  let vaultContract = VaultPackage.bind(vaultContractAddress);
  vaultLibrary.strategyReported(
    ethTransaction,
    strategyReport as StrategyReport,
    vaultContract,
    vaultContractAddress,
    FATHOM_VAULT_ADDRESS,
    event.block.timestamp,
    event.block.number
  );
}

export function handleDebtUpdated(event: DebtUpdated): void {
  log.info('[Strategy Manager mappings] Handle debt updated', []);
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

export function handleUpdatedMaxDebtForStrategy(event: UpdatedMaxDebtForStrategy): void {
  log.info('[Strategy Manager mappings] Handle max debt updated', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedMaxDebtForStrategy'
  );

  strategyLibrary.updateMaxDebt(
    FATHOM_VAULT_ADDRESS,
    event.params.strategy,
    event.params.newDebt,
    ethTransaction
  );
}

export function handleUpdatedFees(event: UpdatedFees): void {
  log.info('[Strategy Manager mappings] Handle updated fees', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatedFees'
  );

  vaultLibrary.updateFees(
    FATHOM_VAULT_ADDRESS,
    ethTransaction,
    event.params.totalFees,
    event.params.totalRefunds,
    event.params.protocolFees,
    event.params.protocolFeeRecipient
  );
}