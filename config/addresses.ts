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
    FathomVault: '0x64a472B648C67ED33913f166FdDCC63130c5032d',
    StrategyManager: '0x509bEC0405BbC7E3066753beFfD3FFDbA5863f25',
    SharesManager: '0x6303479B3cf428ba793133f8cdE84AC527897e46',
    Governance: '0x4dc7677F025a8901b48e430570780E851a039a64',
    Setters: '0xe5Dd91FC9f7c9531A508705a4478BC9caca4F9cB',
    blockNumber: '57600000',
    network: 'apothem'
  }