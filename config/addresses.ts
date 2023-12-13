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
    FathomVault: '0x7514Fb61df8a782db0647160c3FE7b14Cd995Efc',
    StrategyManager: '0x4cC7f4E55bfCaaFc03A0037B7dA3C796EAb52562',
    SharesManager: '0x7699a1c97bDa66E633AD98D9a275271F66DdAe2f',
    Governance: '0x556E6b4613b188Bb63B73F9d217C10D064Dd0ad8',
    Setters: '0xaaF18Eb0a92B280dc60DBcf97F388f0d4C5c4788',
    blockNumber: '57750000',
    network: 'apothem'
  }