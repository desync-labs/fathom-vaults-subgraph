// AS compiler does not like interface
export class Addresses {
    FathomVault: string
    StrategyManager: string
    SharesManager: string
    Governance: string
    Setters: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    FathomVault: '{{FathomVault}}',
    StrategyManager: '{{StrategyManager}}',
    SharesManager: '{{SharesManager}}',
    Governance: '{{Governance}}',
    Setters: '{{Setters}}',
    blockNumber: '{{blockNumber}}',
    network: '{{network}}'
  }