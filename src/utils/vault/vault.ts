import { Address, ethereum, BigInt, log, BigDecimal } from '@graphprotocol/graph-ts';
import {
  AccountVaultPosition,
  AccountVaultPositionUpdate,
  Strategy,
  StrategyReport,
  Transaction,
  Vault,
  VaultUpdate,
  VaultHistoricalApr
} from '../../../generated/schema';
import { VaultPackage } from '../../../generated/templates/FathomVault/VaultPackage';
import { FathomVault as VaultTemplate } from '../../../generated/templates';
import {
  BIGINT_ZERO,
  ZERO_ADDRESS,
  BIGDECIMAL_ZERO
} from '../constants';
import { getOrCreateToken } from '../token';
import * as depositLibrary from '../deposit';
import * as withdrawalLibrary from '../withdrawal';
import * as accountLibrary from '../account/account';
import * as accountVaultPositionLibrary from '../account/vault-position';
import * as vaultUpdateLibrary from './vault-update';
import * as transferLibrary from '../transfer';
import * as tokenLibrary from '../token';

const buildId = (vaultAddress: Address): string => {
  return vaultAddress.toHexString();
};

const createNewVaultFromAddress = (
  vaultAddress: Address,
  transaction: Transaction
): Vault => {
  let id = vaultAddress.toHexString();
  let vaultEntity = new Vault(id);
  let vaultContract = VaultPackage.bind(vaultAddress);
  let token = getOrCreateToken(vaultContract.asset());
  let shareToken = getOrCreateToken(vaultAddress);
  vaultEntity.transaction = transaction.id;
  vaultEntity.token = token.id;
  vaultEntity.shareToken = shareToken.id;

  // empty at creation
  vaultEntity.tags = [];
  vaultEntity.balanceTokens = BIGINT_ZERO;
  vaultEntity.balanceTokensIdle = BIGINT_ZERO;
  vaultEntity.minimumTotalIdle = BIGINT_ZERO;
  vaultEntity.profitMaxUnlockTime = BIGINT_ZERO;
  vaultEntity.totalDebt = BIGINT_ZERO;
  vaultEntity.totalIdle = BIGINT_ZERO;
  vaultEntity.useDefaultQueue = true;

  vaultEntity.sharesSupply = BIGINT_ZERO;
  vaultEntity.apr = BIGDECIMAL_ZERO;

  // vault fields
  vaultEntity.activation = transaction.timestamp;
  vaultEntity.apiVersion = vaultContract.apiVersion();
  vaultEntity.activationBlockNumber = transaction.blockNumber;

  vaultEntity.accountant = vaultContract.accountant();
  vaultEntity.depositLimitModule = vaultContract.depositLimitModule();
  vaultEntity.withdrawLimitModule = vaultContract.withdrawLimitModule();
  let tryDepositLimit = vaultContract.try_depositLimit();
  vaultEntity.depositLimit = tryDepositLimit.reverted
    ? BIGINT_ZERO
    : tryDepositLimit.value;
  // on creation it's 0
  vaultEntity.minUserDeposit = BIGINT_ZERO;

  vaultEntity.shutdown = false;

  //Empty at creation
  vaultEntity.defaultQueue = [];
  vaultEntity.strategyIds = [];

  return vaultEntity;
};

export function getOrCreate(
  vaultAddress: Address,
  transaction: Transaction,
  createTemplate: boolean
): Vault {
  log.info('[Vault] Get or create', []);
  let id = buildId(vaultAddress);
  log.info('[Vault] Vault address: {}', [id]);
  let vault = Vault.load(id);

  if (vault != null) {
    // If the vault exists, log its properties
    log.info('[Vault] Vault ID: {}', [vault.id]);
    log.info('[Vault] Vault Token: {}', [vault.token]);
  } else {
    // If the vault does not exist, create a new one
    log.info('CREATING NEW VAULT!!!!!!!!!!!!!!!!!!!!!', []);
    vault = createNewVaultFromAddress(vaultAddress, transaction);

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
  transaction: Transaction,
  receiver: Address,
  depositedAmount: BigInt,
  sharesMinted: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt
): void {
  log.info(
    '[Vault] Deposit vault: {} receiver: {} depositAmount: {} sharesMinted: {}',
    [
      vaultAddress.toHexString(),
      receiver.toHexString(),
      depositedAmount.toString(),
      sharesMinted.toString(),
    ]
  );
  let vaultContract = VaultPackage.bind(vaultAddress);
  let account = accountLibrary.getOrCreate(receiver);
  let vault = Vault.load(vaultAddress.toHexString()) as Vault;

  accountVaultPositionLibrary.deposit(
    vaultContract,
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
  let balancePosition = getBalancePosition(vaultContract);
  let totalAssets = getTotalAssets(vaultAddress);
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
  sharesMinted: BigInt
): BigInt {
  let vaultContract = VaultPackage.bind(vaultAddress);
  let totalAssets = getTotalAssets(vaultAddress);
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
  from: Address,
  withdrawnAmount: BigInt,
  sharesBurnt: BigInt,
  transaction: Transaction,
  timestamp: BigInt,
  blockNumber: BigInt
): void {
  let vaultContract = VaultPackage.bind(vaultAddress);
  let account = accountLibrary.getOrCreate(from);
  let balancePosition = getBalancePosition(vaultContract);
  let vault = Vault.load(vaultAddress.toHexString()) as Vault;
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
    let vaultUpdateId = vaultUpdateLibrary.buildIdFromVaultAndTransaction(vault, transaction);    
    if (latestVaultUpdate !== null && latestVaultUpdate.id != vaultUpdateId) {
      let vaultUpdate = vaultUpdateLibrary.withdraw(
        vault,
        withdrawnAmount,
        sharesBurnt,
        transaction,
        balancePosition,
        getTotalAssets(vaultAddress),
        timestamp,
        blockNumber
      );
    }
  } else {
    log.info(
      '[Vault] latestVaultUpdate is null and someone is calling withdraw(). Vault: {}',
      [vault.id.toString()]
    );
    // it turns out it is happening
  }
}

export function transfer(
  vaultContract: VaultPackage,
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
  let vault = Vault.load(vaultAddress.toHexString()) as Vault;
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
    fromAccount,
    toAccount,
    vault,
    amount,
    shareAmount,
    transaction
  );

  if (from.toHexString() == ZERO_ADDRESS) {
    vaultUpdateLibrary.deposit(
      vault,
      transaction,
      amount,
      shareAmount,
      getBalancePosition(vaultContract),
      getTotalAssets(vaultAddress),
      transaction.timestamp,
      transaction.blockNumber
    );
  } else if (to.toHexString() == ZERO_ADDRESS) {
    vaultUpdateLibrary.withdraw(
      vault,
      amount,
      shareAmount,
      transaction,
      getBalancePosition(vaultContract),
      getTotalAssets(vaultAddress),
      transaction.timestamp,
      transaction.blockNumber
    );
  }
}

export function strategyReported(
  transaction: Transaction,
  strategyReport: StrategyReport,
  vaultContract: VaultPackage,
  vaultAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
): void {
  log.info('[Vault] Strategy reported for vault {} at TX ', [
    vaultAddress.toHexString(),
    transaction.hash.toHexString(),
  ]);
  let vault = Vault.load(vaultAddress.toHexString()) as Vault;

  if (!vault.latestUpdate) {
    log.warning(
      '[Vault] Strategy reporting despite no previous Vault updates: {} Either this is a unit test, or a a vault/strategy was not set up correctly.',
      [transaction.id.toString()]
    );
  }

  let balancePosition = getBalancePosition(vaultContract);
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

export function updateDefaultQueue(
  newQueue: Address[],
  ethTransaction: Transaction,
  event: ethereum.Event
): void {
    let txHash = ethTransaction.hash.toHexString();
    log.info('Update vault default queue {} at tx {}', [newQueue.toString(), txHash]);
    let vault = Vault.load(event.address.toHexString());
    if (vault != null) {
        let oldWithdrawlQueue = vault.defaultQueue;
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

export function updateUseDefaultQueue(
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

export function getTotalAssets(vaultAddress: Address): BigInt {
  let vaultContract = VaultPackage.bind(vaultAddress);
  let tryTotalAssets = vaultContract.try_totalAssets();
  // TODO Debugging Use totalAssets directly
  let totalAssets = tryTotalAssets.reverted
    ? BigInt.fromI32(0)
    : tryTotalAssets.value;
  return totalAssets;
}

function getBalancePosition(vaultContract: VaultPackage): BigInt {
  let tryTotalAssets = vaultContract.try_totalAssets();
  // TODO Debugging Use totalAssets directly
  let totalAssets = tryTotalAssets.reverted
    ? BigInt.fromI32(0)
    : tryTotalAssets.value;

  if (tryTotalAssets.reverted) {
    log.warning(
      'try_totalAssets (getBalancePosition) FAILED Vault {} - TotalAssets',
      [vaultContract._address.toHexString(), totalAssets.toString()]
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

export function updateMinUserDeposit(
  vaultAddress: Address,
  minUserDeposit: BigInt,
  transaction: Transaction
): void {
  let vault = Vault.load(vaultAddress.toHexString());
  if (vault === null) {
    log.warning(
      'Failed to update vault minUserDeposit, vault does not exist. Vault address: {} deposit limit: {}  Txn hash: {}',
      [
        vaultAddress.toHexString(),
        minUserDeposit.toString(),
        transaction.hash.toHexString(),
      ]
    );
    return;
  } else {
    log.info(
      'Vault minUserDeposit updated. Address: {}, To: {}, on Txn hash: {}',
      [
        vaultAddress.toHexString(),
        minUserDeposit.toString(),
        transaction.hash.toHexString(),
      ]
    );

    vault.minUserDeposit = minUserDeposit;
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

export function calculateVaultApr(vaultId: string, logId: string, timestamp: BigInt) : void {
  let vault = Vault.load(vaultId);

  // for each strategy in the vault, calculate the apr and get the vault apr based on strategies allocation
  let strategies = vault.strategyIds;
  let totalApr = BIGDECIMAL_ZERO;
  for (let i = 0; i < strategies.length; i++) {
    let strategy = Strategy.load(strategies[i]);
    let allocation = strategy.currentDebt.toBigDecimal().div(vault.balanceTokens.toBigDecimal());
    let strategyApr = strategy.apr.times(allocation);
    totalApr = totalApr.plus(strategyApr);
  }

  vault.apr = totalApr;
  vault.save();

  let newVaultHistoricalApr = new VaultHistoricalApr(logId);
  newVaultHistoricalApr.timestamp = timestamp;
  newVaultHistoricalApr.apr = totalApr;
  newVaultHistoricalApr.vault = vaultId;
  newVaultHistoricalApr.save();
}