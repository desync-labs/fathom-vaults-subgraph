import { Address, log } from "@graphprotocol/graph-ts";
import {
  VaultPackageUpdated,
  FeeConfigUpdated,
  VaultDeployed,
  FactoryPackage
} from "../../generated/Factory/FactoryPackage";

import { StrategyReport } from "../../generated/schema";
import {
  getOrCreateTransactionFromEvent,
} from '../utils/transaction';
import * as strategyLibrary from '../utils/strategy/strategy';
import * as factoryLibrary from '../utils/factory/factory';
import { fromSharesToAmount } from '../utils/commons';
import { ZERO_ADDRESS, BIGINT_ZERO } from '../utils/constants';

export function handleVaultPackageUpdated(event: VaultPackageUpdated): void {
  log.info('[Factory mappings] Handle Vault Package updated', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'VaultPackageUpdated'
  );

  factoryLibrary.updateVaultPackage(
    event.address,
    event.params.vaultPackage,
    ethTransaction
  );
}

export function handleFeeConfigUpdated(event: FeeConfigUpdated): void {
  log.info('[Factory mappings] Handle Fee config updated', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'FeeConfigUpdated'
  );

  factoryLibrary.updateFeeConfig(
    event.address,
    event.params.feeBPS,
    event.params.feeRecipient,
    ethTransaction
  );
}

export function handleVaultDeployed(event: VaultDeployed): void {
  log.info('[Factory mappings] Handle Vault Deployed', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'VaultDeployed'
  );

  factoryLibrary.updateVaultsDeployed(
    event.address,
    event.params.vault,
    ethTransaction
  );
}