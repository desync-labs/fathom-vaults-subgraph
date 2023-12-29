import { Address, log } from "@graphprotocol/graph-ts"
import {
  DebtUpdated,
  UpdatedDepositLimit,
  Transfer,
  Deposit,
  Withdraw,
  VaultPackage
} from "../../generated/FathomVault/VaultPackage"
import {
  getOrCreateTransactionFromEvent,
} from '../utils/transaction';
import { ZERO_ADDRESS } from '../utils/constants';
import * as strategyLibrary from '../utils/strategy/strategy';
import * as vaultLibrary from '../utils/vault/vault';
import { fromSharesToAmount } from '../utils/commons';
import { addresses } from "../../config/addresses";

// Constant for the FathomVault contract address
const FATHOM_VAULT_ADDRESS = Address.fromString(addresses.FathomVault)

export function handleDebtUpdated(event: DebtUpdated): void {
  log.info('[Shares Manager mappings] Handle debt updated', []);
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

export function handleTransfer(event: Transfer): void {
  log.info('[Shares Manager mappings] Handle transfer: From: {} - To: {}. TX hash: {}', [
    event.params.from.toHexString(),
    event.params.to.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
  if (
    event.params.from.toHexString() != ZERO_ADDRESS &&
    event.params.to.toHexString() != ZERO_ADDRESS
  ) {
    if (!vaultLibrary.isVault(event.address)) {
      log.info(
        '[Transfer] Transfer {} is not on behalf of a vault entity. Not processing.',
        [event.transaction.hash.toHexString()]
      );
      return;
    }

    log.info(
      '[Shares Manager mappings] Processing transfer: Vault: {} From: {} - To: {}. TX hash: {}',
      [
        FATHOM_VAULT_ADDRESS.toHexString(),
        event.params.from.toHexString(),
        event.params.to.toHexString(),
        event.transaction.hash.toHexString(),
      ]
    );
    let transaction = getOrCreateTransactionFromEvent(
      event,
      'Transfer'
    );
    let vaultContract = VaultPackage.bind(FATHOM_VAULT_ADDRESS);
    let sharesManagerAddress = event.address;
    let totalAssets = vaultLibrary.getTotalAssets(FATHOM_VAULT_ADDRESS);
    let totalSupply = vaultContract.totalSupply();
    let sharesAmount = event.params.value;
    let amount = fromSharesToAmount(sharesAmount, totalAssets, totalSupply);
    // share  = (amount * totalSupply) / totalAssets
    // amount = (shares * totalAssets) / totalSupply
    vaultLibrary.transfer(
      vaultContract,
      sharesManagerAddress,
      event.params.from,
      event.params.to,
      amount,
      vaultContract.asset(),
      sharesAmount,
      FATHOM_VAULT_ADDRESS,
      transaction
    );
  } else {
    log.info(
      '[Shares Manager mappings] Not processing transfer: From: {} - To: {}. TX hash: {}',
      [
        event.params.from.toHexString(),
        event.params.to.toHexString(),
        event.transaction.hash.toHexString(),
      ]
    );
  }
}

export function handleDeposit(event: Deposit): void {
  log.debug('[Shares Manager mappings] Handle deposit', []);

  let transaction = getOrCreateTransactionFromEvent(event, 'Deposit');

  let amount = event.params.assets;
  let sharesMinted = event.params.shares;
  let recipient = event.params.owner;
  let sharesManagerAddress = event.address;
  let vaultAddress = FATHOM_VAULT_ADDRESS;

  log.info('[Shares Manager mappings] Handle deposit shares {} - amount {}', [
    sharesMinted.toString(),
    amount.toString(),
  ]);

  vaultLibrary.deposit(
    vaultAddress,
    sharesManagerAddress,
    transaction,
    recipient,
    amount,
    sharesMinted,
    event.block.timestamp,
    event.block.number
  );
}

export function handleWithdraw(event: Withdraw): void {
  log.debug('[Shares Manager mappings] Handle withdraw', []);

  let transaction = getOrCreateTransactionFromEvent(event, 'Withdraw');

  let amount = event.params.assets;
  let sharesBurnt = event.params.shares;
  let recipient = event.params.receiver;
  let sharesManagerAddress = event.address;
  let vaultAddress = FATHOM_VAULT_ADDRESS;

  log.info('[Shares Manager mappings] Handle withdraw shares {} - amount {}', [
    sharesBurnt.toString(),
    amount.toString(),
  ]);

  vaultLibrary.withdraw(
    vaultAddress,
    sharesManagerAddress,
    recipient,
    amount,
    sharesBurnt,
    transaction,
    event.block.timestamp,
    event.block.number
  );
}
