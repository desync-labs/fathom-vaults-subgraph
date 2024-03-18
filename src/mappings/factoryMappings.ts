import { log } from "@graphprotocol/graph-ts";
import {
  VaultPackageUpdated,
  FeeConfigUpdated,
  VaultDeployed
} from "../../generated/Factory/FactoryPackage";
import {
  getOrCreateTransactionFromEvent,
} from '../utils/transaction';
import * as factoryLibrary from '../utils/factory/factory';
import * as vaultLibrary from '../utils/vault/vault';
import {
  DO_CREATE_VAULT_TEMPLATE,
} from '../utils/constants';

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

  log.info('[Factory mappings] VAULT DEPLOYED: {}', [event.params.vault.toHexString()]);

  let vault = vaultLibrary.getOrCreate(event.params.vault, ethTransaction, DO_CREATE_VAULT_TEMPLATE);
  vault.save();
}