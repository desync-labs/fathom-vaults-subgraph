import { Address, ethereum, BigInt, log, Bytes } from '@graphprotocol/graph-ts';
import {
  AccountVaultPosition,
  AccountVaultPositionUpdate,
  Factory,
  Strategy,
  StrategyReport,
  Transaction,
  Vault,
  VaultUpdate,
} from '../../../generated/schema';
import { VaultPackage } from '../../../generated/templates/FathomVault/VaultPackage';
import { FathomVault as VaultTemplate } from '../../../generated/templates';
import {
  BIGINT_ZERO,
  DO_CREATE_VAULT_TEMPLATE,
  ZERO_ADDRESS,
} from '../constants';
import { getOrCreateToken } from '../token';
import * as depositLibrary from '../deposit';
import * as withdrawalLibrary from '../withdrawal';
import * as accountLibrary from '../account/account';
import * as accountVaultPositionLibrary from '../account/vault-position';
import * as transferLibrary from '../transfer';
import * as tokenLibrary from '../token';
import { booleanToString, removeElementFromArray } from '../commons';
import { FactoryPackage } from '../../../generated/Factory/FactoryPackage';

export function getOrCreateFactory(factoryAddress: Address, transaction: Transaction): Factory {
  let factoryId = factoryAddress.toHexString();
  let factory = Factory.load(factoryId);

  if (factory === null) {
    factory = new Factory(factoryId);
    // Initialize the properties of the new Factory entity
    factory.timestamp = transaction.timestamp;
    factory.protocolFee = 0;
    factory.feeRecipient = Bytes.fromHexString(ZERO_ADDRESS) as Bytes;
    factory.vaultPackage = Bytes.fromHexString(ZERO_ADDRESS) as Bytes;
    factory.vaults = [];

    // Save the new Factory entity
    factory.save();
  }

  return factory as Factory;
}

export function updateVaultPackage(
  factoryAddress: Address,
  vaultPackage: Address,
  transaction: Transaction
): void {
  log.debug(
    '[Factory] Update Factory: {} New Vault Package: {}',
    [
      factoryAddress.toHexString(),
      vaultPackage.toHexString()
    ]
  );
  let factory = getOrCreateFactory(factoryAddress, transaction);

  factory.vaultPackage = vaultPackage;
  factory.save();
}

export function updateFeeConfig(
  factoryAddress: Address,
  feeBPS: number,
  feeRecipient: Address,
  transaction: Transaction
): void {
  log.debug(
    '[Factory] Update Fee Config: New FeeBPS {} New Fee Recipient: {}',
    [
      feeBPS.toString(),
      feeRecipient.toHexString()
    ]
  );
  let factory = getOrCreateFactory(factoryAddress, transaction);

  factory.protocolFee = feeBPS as i32;
  factory.feeRecipient = feeRecipient;
  factory.save();
}

export function updateVaultsDeployed(
  factoryAddress: Address,
  vault: Address,
  transaction: Transaction
): void {
  log.debug(
    '[Factory] Update Vaults Deployed: New Vault {}',
    [
      vault.toHexString(),
    ]
  );

  // Load the Factory entity or create a new one if it doesn't exist
  let factory = getOrCreateFactory(factoryAddress, transaction);

  // Add the new vault address to the vaults array
  let vaultsArray = factory.vaults;
  vaultsArray.push(Bytes.fromHexString(vault.toHexString()) as Bytes);
  factory.vaults = vaultsArray;

  // Save the updated Factory entity
  factory.save();
}
