import { Address, ethereum, BigInt, log, Bytes } from '@graphprotocol/graph-ts';
import {
  AccountVaultPosition,
  AccountVaultPositionUpdate,
  Accountant,
  Factory,
  Strategy,
  StrategyReport,
  Transaction,
  Vault,
  VaultUpdate,
} from '../../../generated/schema';
import { VaultPackage } from '../../../generated/FathomVault/VaultPackage';
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

export function getOrCreateAccountant(accountantAddress: Address, transaction: Transaction): Accountant {
  let accountantId = accountantAddress.toHexString();
  let accountant = Accountant.load(accountantId);

  if (accountant === null) {
    accountant = new Accountant(accountantId);
    // Initialize the properties of the new Accountant entity
    accountant.timestamp = transaction.timestamp;
    accountant.performanceFee = BigInt.fromI32(0);
    accountant.feeRecipient = Bytes.fromHexString(ZERO_ADDRESS) as Bytes;

    // Save the new Factory entity
    accountant.save();
  }

  return accountant as Accountant;
}

export function updatePerformanceFee(
  accountantAddress: Address,
  performanceFee: BigInt,
  transaction: Transaction
): void {
  log.debug(
    '[Accountant] Update Performance Fee: {}',
    [
      performanceFee.toString()
    ]
  );
  let accountant = getOrCreateAccountant(accountantAddress, transaction);

  accountant.performanceFee = performanceFee;
  accountant.save();
}

export function updateFeeRecipient(
  accountantAddress: Address,
  feeRecipient: Address,
  transaction: Transaction
): void {
  log.debug(
    '[Accountant] Update Fee Recipient: {}',
    [
      feeRecipient.toHexString()
    ]
  );
  let accountant = getOrCreateAccountant(accountantAddress, transaction);

  accountant.feeRecipient = feeRecipient;
  accountant.save();
}
