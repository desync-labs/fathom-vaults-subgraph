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
import * as accountantLibrary from '../utils/accountant/accountant';
import { fromSharesToAmount } from '../utils/commons';
import { ZERO_ADDRESS, BIGINT_ZERO } from '../utils/constants';
import { FeeRecipientSet, PerformanceFeeSet } from "../../generated/Accountant/GenericAccountant";

export function handlePerformanceFeeSet(event: PerformanceFeeSet): void {
  log.info('[Accountant mappings] Handle Perfomance Fee updated', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'PerformanceFeeSet'
  );

  accountantLibrary.updatePerformanceFee(
    event.address,
    event.params.fee,
    ethTransaction
  );
}

export function handleFeeRecipientSet(event: FeeRecipientSet): void {
  log.info('[Accountant mappings] Handle Fee Recipient updated', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'FeeRecipientSet'
  );

  accountantLibrary.updateFeeRecipient(
    event.address,
    event.params.feeRecipient,
    ethTransaction
  );
}