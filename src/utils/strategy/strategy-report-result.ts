import { BigDecimal, log } from '@graphprotocol/graph-ts';
import {
  StrategyReport,
  StrategyReportResult,
  Transaction,
  Vault,
  Strategy
} from '../../../generated/schema';
import { buildIdFromTransaction } from '../commons';
import { BIGDECIMAL_ZERO, DAYS_PER_YEAR, MS_PER_DAY, BIGINT_ZERO } from '../constants';

export function create(
  transaction: Transaction,
  previousReport: StrategyReport,
  currentReport: StrategyReport
): StrategyReportResult {
  if (currentReport.id == previousReport.id) {
    log.info(
      '[StrategyReportResult] Previous report {} and current report {} are the same. No strategy report result created.',
      [previousReport.id, currentReport.id]
    );
    return null;
  } else {
    let txHash = transaction.hash.toHexString();
    log.info(
      '[StrategyReportResult] Create strategy report result between previous {} and current report {}. Strategy {} TxHash: {}',
      [previousReport.id, currentReport.id, currentReport.strategy, txHash]
    );

    let id = buildIdFromTransaction(transaction);
    let strategyReportResult = new StrategyReportResult(id);
    strategyReportResult.timestamp = transaction.timestamp;
    strategyReportResult.blockNumber = transaction.blockNumber;
    strategyReportResult.currentReport = currentReport.id;
    strategyReportResult.previousReport = previousReport.id;
    strategyReportResult.startTimestamp = previousReport.timestamp;
    strategyReportResult.endTimestamp = currentReport.timestamp;
    strategyReportResult.duration = currentReport.timestamp
      .toBigDecimal()
      .minus(previousReport.timestamp.toBigDecimal());
    strategyReportResult.durationPr = BIGDECIMAL_ZERO;
    strategyReportResult.apr = BIGDECIMAL_ZERO;
    strategyReportResult.transaction = transaction.id;

    let profit = currentReport.gain.plus(currentReport.loss);
    let msInDays = strategyReportResult.duration.div(MS_PER_DAY);
    log.info(
      '[StrategyReportResult] Report Result - Start / End: {} / {} - Duration: {} (days {}) - Profit: {} - TxHash: {}',
      [
        strategyReportResult.startTimestamp.toString(),
        strategyReportResult.endTimestamp.toString(),
        strategyReportResult.duration.toString(),
        msInDays.toString(),
        profit.toString(),
        txHash,
      ]
    );

    if (!previousReport.currentDebt.isZero() && !msInDays.equals(BIGDECIMAL_ZERO)) {
      let profitOverTotalDebt = profit
        .toBigDecimal()
        .div(previousReport.currentDebt.toBigDecimal());
      strategyReportResult.durationPr = profitOverTotalDebt;
      let yearOverDuration = DAYS_PER_YEAR.div(msInDays);
      let apr = profitOverTotalDebt.times(yearOverDuration).times(BigDecimal.fromString('100'));

      log.info(
        '[StrategyReportResult] Report Result - Duration: {} ms / {} days - Duration (Year): {} - Profit / Total Debt: {} / APR: {} - TxHash: {}',
        [
          strategyReportResult.duration.toString(),
          msInDays.toString(),
          yearOverDuration.toString(),
          profitOverTotalDebt.toString(),
          apr.toString(),
          txHash,
        ]
      );
      strategyReportResult.apr = apr;
    }

    let strategy = Strategy.load(currentReport.strategy);
    let vault = Vault.load(strategy.vault);
    let reportCount = strategy.reportsCount;
    let numeratorVault = (vault.apr).plus(strategyReportResult.apr);
    let numeratorStrategy = (strategy.apr).plus(strategyReportResult.apr);
    if (reportCount.equals(BIGDECIMAL_ZERO)) {
      vault.apr = numeratorVault;
      strategy.apr = numeratorStrategy;
    } else {
      vault.apr = numeratorVault.div(reportCount);
      strategy.apr = numeratorStrategy.div(reportCount);
    }
    strategy.reportsCount = reportCount.plus(BigDecimal.fromString('1'));
    strategy.save();
    vault.save();
    strategyReportResult.save();
    return strategyReportResult;
  }
}