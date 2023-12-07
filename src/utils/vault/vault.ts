import { Address, ethereum, BigInt, log } from '@graphprotocol/graph-ts';
import {
  AccountVaultPosition,
  AccountVaultPositionUpdate,
  Strategy,
  StrategyReport,
  Transaction,
  Vault,
  VaultUpdate,
} from '../../../generated/schema';
import { FathomVault } from '../../../generated/FathomVault/FathomVault';
import { FathomVault as VaultTemplate } from '../../../generated/templates';
import {
  BIGINT_ZERO,
  DO_CREATE_VAULT_TEMPLATE,
  REGISTRY_V3_VAULT_TYPE_LEGACY,
  ZERO_ADDRESS,
} from '../constants';
import { getOrCreateToken } from '../token';
import * as depositLibrary from '../deposit';
import * as withdrawalLibrary from '../withdrawal';
import * as accountLibrary from '../account/account';
import * as accountVaultPositionLibrary from '../account/vault-position';
import * as vaultUpdateLibrary from './vault-update';
import * as transferLibrary from '../transfer';
import * as tokenLibrary from '../token';
import { updateVaultDayData } from './vault-day-data';
import { booleanToString, removeElementFromArray } from '../commons';
import { SharesManager } from '../../../generated/SharesManager/SharesManager';

const buildId = (vaultAddress: Address): string => {
  return vaultAddress.toHexString();
};

const createNewVaultFromAddress = (
  vaultAddress: Address,
  sharesManagerAddress: Address,
  transaction: Transaction
): Vault => {
  let id = vaultAddress.toHexString();
  let vaultEntity = new Vault(id);
  let vaultContract = FathomVault.bind(vaultAddress);
  let token = getOrCreateToken(vaultContract.asset());
  let shareToken = getOrCreateToken(sharesManagerAddress);
  vaultEntity.transaction = transaction.id;
  vaultEntity.token = token.id;
  vaultEntity.shareToken = shareToken.id;

  // empty at creation
  vaultEntity.tags = [];
  vaultEntity.balanceTokens = BIGINT_ZERO;
  vaultEntity.balanceTokensIdle = BIGINT_ZERO;
  vaultEntity.minimumTotalIdle = BIGINT_ZERO;
  vaultEntity.profitMaxUnlockTime = BIGINT_ZERO;
  vaultEntity.totalDebtAmount = BIGINT_ZERO;
  vaultEntity.totalIdleAmount = BIGINT_ZERO;
  vaultEntity.useDefaultQueue = true;

  vaultEntity.sharesSupply = BIGINT_ZERO;

  // vault fields
  vaultEntity.activation = transaction.timestamp;
  vaultEntity.apiVersion = vaultContract.API_VERSION();
  vaultEntity.activationBlockNumber = transaction.blockNumber;

  vaultEntity.accountant = vaultContract.accountant();
  vaultEntity.roleManager = vaultContract.roleManager();
  vaultEntity.depositLimitModule = vaultContract.depositLimitModule();
  vaultEntity.withdrawLimitModule = vaultContract.withdrawLimitModule();
  let tryDepositLimit = vaultContract.try_depositLimit();
  vaultEntity.depositLimit = tryDepositLimit.reverted
    ? BIGINT_ZERO
    : tryDepositLimit.value;

  vaultEntity.shutdown = false;

  //Empty at creation
  vaultEntity.defaultQueue = [];
  vaultEntity.strategyIds = [];

  return vaultEntity;
};

export function getOrCreate(
  vaultAddress: Address,
  sharesManagerAddress: Address,
  transaction: Transaction,
  createTemplate: boolean
): Vault {
  log.debug('[Vault] Get or create', []);
  let id = buildId(vaultAddress);
  let vault = Vault.load(id);

  if (vault == null) {
    log.info('CREATING NEW VAULT!!!!!!!!!!!!!!!!!!!!!1', []);
    vault = createNewVaultFromAddress(vaultAddress, sharesManagerAddress, transaction);

    if (createTemplate) {
      VaultTemplate.create(vaultAddress);
    }
  }

  return vault as Vault;
}

export function tag(vault: Address, tag: string): Vault | null {
  let id = buildId(vault);
  log.info('Processing tag for vault address: {}', [id]);
  let entity = Vault.load(id);
  if (entity == null) {
    log.warning("Vault DOESN'T exist for tagging: {}", [id]);
    return null;
  } else {
    entity.tags = tag.split(',');
    entity.save();
    return entity;
  }
}

export function deposit(
  vaultAddress: Address,
  sharesManagerAddress: Address,
  transaction: Transaction,
  receiver: Address,
  depositedAmount: BigInt,
  sharesMinted: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt
): void {
  log.debug(
    '[Vault] Deposit vault: {} receiver: {} depositAmount: {} sharesMinted: {}',
    [
      vaultAddress.toHexString(),
      receiver.toHexString(),
      depositedAmount.toString(),
      sharesMinted.toString(),
    ]
  );
  let vaultContract = FathomVault.bind(vaultAddress);
  let account = accountLibrary.getOrCreate(receiver);
  let vault = getOrCreate(vaultAddress, sharesManagerAddress, transaction, DO_CREATE_VAULT_TEMPLATE);

  accountVaultPositionLibrary.deposit(
    vaultContract,
    sharesManagerAddress,
    account,
    vault,
    transaction,
    depositedAmount,
    sharesMinted
  );

  depositLibrary.getOrCreate(
    account,
    vault,
    transaction,
    depositedAmount,
    sharesMinted
  );

  let vaultUpdate: VaultUpdate;
  let balancePosition = getBalancePosition(vaultContract, sharesManagerAddress);
  let totalAssets = getTotalAssets(sharesManagerAddress);
  if (vault.latestUpdate == null) {
    vaultUpdate = vaultUpdateLibrary.firstDeposit(
      vault,
      transaction,
      depositedAmount,
      sharesMinted,
      balancePosition,
      totalAssets,
      timestamp,
      blockNumber
    );
  } else {
    vaultUpdate = vaultUpdateLibrary.deposit(
      vault,
      transaction,
      depositedAmount,
      sharesMinted,
      balancePosition,
      totalAssets,
      timestamp,
      blockNumber
    );
  }
}

/* Calculates the amount of tokens deposited via totalAssets/totalSupply arithmetic. */
export function calculateAmountDeposited(
  vaultAddress: Address,
  sharesManagerAddress: Address,
  sharesMinted: BigInt
): BigInt {
  let vaultContract = FathomVault.bind(vaultAddress);
  let totalAssets = getTotalAssets(sharesManagerAddress);
  let totalSupply = vaultContract.totalSupply();
  let amount = totalSupply.isZero()
    ? BIGINT_ZERO
    : sharesMinted.times(totalAssets).div(totalSupply);
  log.info(
    '[Vault] Indirectly calculating token qty deposited. shares minted: {} - total assets {} - total supply {} - calc deposited tokens: {}',
    [
      sharesMinted.toString(),
      totalAssets.toString(),
      totalSupply.toString(),
      amount.toString(),
    ]
  );
  return amount;
}

export function isVault(vaultAddress: Address): boolean {
  let id = buildId(vaultAddress);
  let vault = Vault.load(id);
  return vault !== null;
}

export function withdraw(
  vaultAddress: Address,
  sharesManagerAddress: Address,
  from: Address,
  withdrawnAmount: BigInt,
  sharesBurnt: BigInt,
  transaction: Transaction,
  timestamp: BigInt,
  blockNumber: BigInt
): void {
  let vaultContract = FathomVault.bind(vaultAddress);
  let account = accountLibrary.getOrCreate(from);
  let balancePosition = getBalancePosition(vaultContract, sharesManagerAddress);
  let vault = getOrCreate(vaultAddress, sharesManagerAddress, transaction, DO_CREATE_VAULT_TEMPLATE);
  withdrawalLibrary.getOrCreate(
    account,
    vault,
    transaction,
    withdrawnAmount,
    sharesBurnt
  );

  // Updating Account Vault Position Update
  let accountVaultPositionId = accountVaultPositionLibrary.buildId(
    account,
    vault
  );
  let accountVaultPosition = AccountVaultPosition.load(accountVaultPositionId);
  // This scenario where accountVaultPosition === null shouldn't happen. Account vault position should have been created when the account deposited the tokens.
  if (accountVaultPosition !== null) {
    let latestAccountVaultPositionUpdate = AccountVaultPositionUpdate.load(
      accountVaultPosition.latestUpdate
    );
    // The scenario where latestAccountVaultPositionUpdate === null shouldn't happen. One account vault position update should have created when user deposited the tokens.
    if (latestAccountVaultPositionUpdate !== null) {
      accountVaultPositionLibrary.withdraw(
        vaultContract,
        sharesManagerAddress,
        accountVaultPosition as AccountVaultPosition,
        withdrawnAmount,
        sharesBurnt,
        transaction
      );
    } else {
      log.warning(
        'INVALID withdraw: Account vault position update NOT found. ID {} Vault {} TX {} from {}',
        [
          accountVaultPosition.latestUpdate,
          vaultAddress.toHexString(),
          transaction.hash.toHexString(),
          from.toHexString(),
        ]
      );
    }
  } else {
    /*
      This case should not exist because it means an user already has share tokens without having deposited before.
      BUT due to some vaults were deployed, and registered in the registry after several blocks, there are cases were some users deposited tokens before the vault were registered (in the registry).
      Example:
        Account:  0x557cde75c38b2962be3ca94dced614da774c95b0
        Vault:    0xbfa4d8aa6d8a379abfe7793399d3ddacc5bbecbb

        Vault registered at tx (block 11579536): https://etherscan.io/tx/0x6b51f1f743ec7a42db6ba1995e4ade2ba0e5b8f1fec03d3dd599a90da66d6f69

        Account transfers:
        https://etherscan.io/token/0xbfa4d8aa6d8a379abfe7793399d3ddacc5bbecbb?a=0x557cde75c38b2962be3ca94dced614da774c95b0

        The first two deposits were at blocks 11557079 and 11553285. In both cases, some blocks after registering the vault.

        As TheGraph doesn't support to process blocks before the vault was registered (using the template feature), these cases are treated as special cases (pending to fix).
    */
    log.warning(
      '[Vault] AccountVaultPosition for vault {} did not exist when withdrawl was executed. Missing position id: {}',
      [vaultAddress.toHexString(), accountVaultPositionId]
    );
    if (withdrawnAmount.isZero()) {
      log.warning(
        'INVALID zero amount withdraw: Account vault position NOT found. ID {} Vault {} TX {} from {}',
        [
          accountVaultPositionId,
          vaultAddress.toHexString(),
          transaction.hash.toHexString(),
          from.toHexString(),
        ]
      );
      accountVaultPositionLibrary.withdrawZero(account, vault, transaction);
    } else {
      log.warning(
        'INVALID withdraw: Account vault position NOT found. ID {} Vault {} TX {} from {}',
        [
          accountVaultPositionId,
          vaultAddress.toHexString(),
          transaction.hash.toHexString(),
          from.toHexString(),
        ]
      );
    }
  }

  // Updating Vault Update
  if (vault.latestUpdate !== null) {
    let latestVaultUpdate = VaultUpdate.load(vault.latestUpdate!);
    // This scenario where latestVaultUpdate === null shouldn't happen. One vault update should have created when user deposited the tokens.
    if (latestVaultUpdate !== null) {
      let vaultUpdate = vaultUpdateLibrary.withdraw(
        vault,
        withdrawnAmount,
        sharesBurnt,
        transaction,
        balancePosition,
        getTotalAssets(sharesManagerAddress),
        timestamp,
        blockNumber
      );
    }
  } else {
    log.warning(
      '[Vault] latestVaultUpdate is null and someone is calling withdraw(). Vault: {}',
      [vault.id.toString()]
    );
    // it turns out it is happening
  }
}

export function transfer(
  vaultContract: FathomVault,
  sharesManagerAddress: Address,
  from: Address,
  to: Address,
  amount: BigInt,
  wantTokenAddress: Address,
  shareAmount: BigInt,
  vaultAddress: Address,
  transaction: Transaction
): void {
  let token = tokenLibrary.getOrCreateToken(wantTokenAddress);
  let shareToken = tokenLibrary.getOrCreateToken(vaultAddress);
  let fromAccount = accountLibrary.getOrCreate(from);
  let toAccount = accountLibrary.getOrCreate(to);
  let vault = getOrCreate(vaultAddress, sharesManagerAddress, transaction, DO_CREATE_VAULT_TEMPLATE);
  transferLibrary.getOrCreate(
    fromAccount,
    toAccount,
    vault,
    token,
    amount,
    shareToken,
    shareAmount,
    transaction
  );

  accountVaultPositionLibrary.transfer(
    vaultContract,
    sharesManagerAddress,
    fromAccount,
    toAccount,
    vault,
    amount,
    shareAmount,
    transaction
  );
}

export function strategyReported(
  transaction: Transaction,
  strategyReport: StrategyReport,
  vaultContract: FathomVault,
  vaultAddress: Address,
  SHARES_MANAGER_ADDRESS: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
): void {
  log.info('[Vault] Strategy reported for vault {} at TX ', [
    vaultAddress.toHexString(),
    transaction.hash.toHexString(),
  ]);
  let vault = getOrCreate(vaultAddress, SHARES_MANAGER_ADDRESS, transaction, DO_CREATE_VAULT_TEMPLATE);

  if (!vault.latestUpdate) {
    log.warning(
      '[Vault] Strategy reporting despite no previous Vault updates: {} Either this is a unit test, or a a vault/strategy was not set up correctly.',
      [transaction.id.toString()]
    );
  }

  let balancePosition = getBalancePosition(vaultContract, SHARES_MANAGER_ADDRESS);
  let grossReturnsGenerated = strategyReport.gain.minus(strategyReport.loss);
  let currentTotalFees = strategyReport.totalFees;

  vaultUpdateLibrary.strategyReported(
    vault,
    transaction,
    balancePosition,
    grossReturnsGenerated,
    currentTotalFees,
    timestamp,
    blockNumber
  );
}

export function UpdateDefaultQueue(
  newQueue: Address[],
  ethTransaction: Transaction,
  event: ethereum.Event
): void {
    let txHash = ethTransaction.hash.toHexString();
    log.info('Update vault default queue {} at tx {}', [newQueue.toString(), txHash]);
    let vault = Vault.load(event.address.toHexString());
    if (vault != null) {
        const oldWithdrawlQueue = vault.defaultQueue;
        //Before we can set the new queue we need to remove all previous strats
        for (let i = 0; i < oldWithdrawlQueue.length; i++) {
        let currentStrategyAddress = oldWithdrawlQueue[i];
        let currentStrategy = Strategy.load(currentStrategyAddress);

        //Setting the inQueue field on the strat to false
        if (currentStrategy !== null) {
            currentStrategy.inQueue = false;
            currentStrategy.save();
        }
        }
        //Initialize a new empty queue
        let vaultsNewWithdrawlQueue = new Array<string>();

        //Now we can add the new strats to the queue
        for (let i = 0; i < newQueue.length; i++) {
        let currentStrategyAddress = newQueue[i].toHexString();
        let currentStrategy = Strategy.load(currentStrategyAddress);

        //Setting the inQueue field on the strat to true
        if (currentStrategy !== null) {
            currentStrategy.inQueue = true;
            currentStrategy.save();
        }

        //Add the strates addr to the vaults withdrawlQueue
        vaultsNewWithdrawlQueue.push(currentStrategyAddress);
        }
        vault.defaultQueue = vaultsNewWithdrawlQueue;
        vault.save();
    }
}

export function UpdateUseDefaultQueue(
    useDefaultQueue: boolean,
    ethTransaction: Transaction,
    event: ethereum.Event
  ): void {
      let txHash = ethTransaction.hash.toHexString();
      log.info('Update use default queue on vault {} at tx {}', [useDefaultQueue.toString(), txHash]);
      let vault = Vault.load(event.address.toHexString());
      if (vault != null) {
          vault.useDefaultQueue = useDefaultQueue;
          vault.save();
      }
  }

export function getTotalAssets(sharesManager: Address): BigInt {
  let sharesManagerContract = SharesManager.bind(sharesManager);
  let tryTotalAssets = sharesManagerContract.try_totalAssets();
  // TODO Debugging Use totalAssets directly
  let totalAssets = tryTotalAssets.reverted
    ? BigInt.fromI32(0)
    : tryTotalAssets.value;
  return totalAssets;
}

function getBalancePosition(vaultContract: FathomVault, sharesManager: Address): BigInt {
  let sharesManagerContract = SharesManager.bind(sharesManager);
  let tryTotalAssets = sharesManagerContract.try_totalAssets();
  // TODO Debugging Use totalAssets directly
  let totalAssets = tryTotalAssets.reverted
    ? BigInt.fromI32(0)
    : tryTotalAssets.value;

  if (tryTotalAssets.reverted) {
    log.warning(
      'try_totalAssets (getBalancePosition) FAILED Vault {} - TotalAssets',
      [sharesManagerContract._address.toHexString(), totalAssets.toString()]
    );
  }
  let tryPricePerShare = vaultContract.try_pricePerShare();
  let pricePerShare = tryPricePerShare.reverted
    ? BigInt.fromI32(0)
    : tryPricePerShare.value;
  // TODO Debugging Use pricePerShare directly
  if (tryPricePerShare.reverted) {
    log.warning(
      'try_pricePerShare (getBalancePosition) FAILED Vault {} - PricePerShare',
      [vaultContract._address.toHexString(), pricePerShare.toString()]
    );
  } else {
    log.warning(
      'try_pricePerShare (getBalancePosition) SUCCESS Vault {} - PricePerShare',
      [vaultContract._address.toHexString(), pricePerShare.toString()]
    );
  }
  // @ts-ignore
  let decimals = u8(vaultContract.decimals());
  return totalAssets.times(pricePerShare).div(BigInt.fromI32(10).pow(decimals));
}

export function updateRoleManager(
  vaultAddress: Address,
  roleManager: Address,
  transaction: Transaction
): void {
  let vault = Vault.load(vaultAddress.toHexString());
  if (vault === null) {
    log.warning(
      'Failed to update vault role manager, vault does not exist. Vault address: {} role manager address: {}  Txn hash: {}',
      [
        vaultAddress.toHexString(),
        roleManager.toHexString(),
        transaction.hash.toHexString(),
      ]
    );
    return;
  } else {
    log.info(
      'Vault role manager updated. Vault address: {}, To: {}, on Txn hash: {}',
      [
        vaultAddress.toHexString(),
        roleManager.toString(),
        transaction.hash.toHexString(),
      ]
    );

    vault.roleManager = roleManager;
    vault.save();
  }
}

export function updateAccountant(
  vaultAddress: Address,
  accountantAddress: Address,
  transaction: Transaction
): void {
  let vault = Vault.load(vaultAddress.toHexString());
  if (vault === null) {
    log.warning(
      'Failed to update vault accountant, vault does not exist. Vault address: {} accountant address: {}  Txn hash: {}',
      [
        vaultAddress.toHexString(),
        accountantAddress.toHexString(),
        transaction.hash.toHexString(),
      ]
    );
    return;
  } else {
    log.info('Vault accountant updated. Address: {}, To: {}, on Txn hash: {}', [
      vaultAddress.toHexString(),
      accountantAddress.toString(),
      transaction.hash.toHexString(),
    ]);

    vault.accountant = accountantAddress;
    vault.save();
  }
}

export function updateDepositLimit(
  vaultAddress: Address,
  depositLimit: BigInt,
  transaction: Transaction
): void {
  let vault = Vault.load(vaultAddress.toHexString());
  if (vault === null) {
    log.warning(
      'Failed to update vault deposit limit, vault does not exist. Vault address: {} deposit limit: {}  Txn hash: {}',
      [
        vaultAddress.toHexString(),
        depositLimit.toString(),
        transaction.hash.toHexString(),
      ]
    );
    return;
  } else {
    log.info(
      'Vault deposit limit updated. Address: {}, To: {}, on Txn hash: {}',
      [
        vaultAddress.toHexString(),
        depositLimit.toString(),
        transaction.hash.toHexString(),
      ]
    );

    vault.depositLimit = depositLimit;
    vault.save();
  }
}

export function updateMinimumTotalIdle(
  vaultAddress: Address,
  minimumTotalIdle: BigInt,
  transaction: Transaction
): void {
  let vault = Vault.load(vaultAddress.toHexString());
  if (vault === null) {
    log.warning(
      'Failed to update vault minimum total idle, vault does not exist. Vault address: {} minimum total idle: {}  Txn hash: {}',
      [
        vaultAddress.toHexString(),
        minimumTotalIdle.toString(),
        transaction.hash.toHexString(),
      ]
    );
    return;
  } else {
    log.info(
      'Vault minimum total idle updated. Address: {}, To: {}, on Txn hash: {}',
      [
        vaultAddress.toHexString(),
        minimumTotalIdle.toString(),
        transaction.hash.toHexString(),
      ]
    );

    vault.minimumTotalIdle = minimumTotalIdle;
    vault.save();
  }
}

export function updateProfitMaxUnlockTime(
  vaultAddress: Address,
  profitMaxUnlockTime: BigInt,
  transaction: Transaction
): void {
  let vault = Vault.load(vaultAddress.toHexString());
  if (vault === null) {
    log.warning(
      'Failed to update vault profit max unlock time, vault does not exist. Vault address: {} profit max unlock time: {}  Txn hash: {}',
      [
        vaultAddress.toHexString(),
        profitMaxUnlockTime.toString(),
        transaction.hash.toHexString(),
      ]
    );
    return;
  } else {
    log.info(
      'Vault profit max unlock time updated. Address: {}, To: {}, on Txn hash: {}',
      [
        vaultAddress.toHexString(),
        profitMaxUnlockTime.toString(),
        transaction.hash.toHexString(),
      ]
    );

    vault.profitMaxUnlockTime = profitMaxUnlockTime;
    vault.save();
  }
}

export function shutdown(
  vaultAddress: Address,
  transaction: Transaction
): void {
  let vault = Vault.load(buildId(vaultAddress));
  if (vault === null) {
    log.warning(
      'Failed to shutdown, vault does not exist. Vault address: {} Txn hash: {}',
      [
        buildId(vaultAddress),
        transaction.hash.toHexString(),
      ]
    );
    return;
  } else {
    log.info(
      'Vault shutdown. Address: {} on Txn hash: {}',
      [
        buildId(vaultAddress),
        transaction.hash.toHexString(),
      ]
    );

    vault.shutdown = true;
    vault.save();
  }
}

export function updateDepositLimitModule(
  vaultAddress: Address,
  depositLimitModule: Address,
  transaction: Transaction
): void {
  let vault = Vault.load(vaultAddress.toHexString());
  if (vault === null) {
    log.warning(
      'Failed to update deposit limit module, vault does not exist. Vault address: {} deposit limit module: {}  Txn hash: {}',
      [
        vaultAddress.toHexString(),
        depositLimitModule.toString(),
        transaction.hash.toHexString(),
      ]
    );
    return;
  } else {
    log.info(
      'Vault deposit limit module updated. Address: {}, To: {}, on Txn hash: {}',
      [
        vaultAddress.toHexString(),
        depositLimitModule.toString(),
        transaction.hash.toHexString(),
      ]
    );

    vault.depositLimitModule = depositLimitModule;
    vault.save();
  }
}

export function updateWithdrawLimitModule(
  vaultAddress: Address,
  withdrawLimitModule: Address,
  transaction: Transaction
): void {
  let vault = Vault.load(vaultAddress.toHexString());
  if (vault === null) {
    log.warning(
      'Failed to update withdraw limit module, vault does not exist. Vault address: {} withdraw limit module: {}  Txn hash: {}',
      [
        vaultAddress.toHexString(),
        withdrawLimitModule.toString(),
        transaction.hash.toHexString(),
      ]
    );
    return;
  } else {
    log.info(
      'Vault withdraw limit module updated. Address: {}, To: {}, on Txn hash: {}',
      [
        vaultAddress.toHexString(),
        withdrawLimitModule.toString(),
        transaction.hash.toHexString(),
      ]
    );

    vault.withdrawLimitModule = withdrawLimitModule;
    vault.save();
  }
}