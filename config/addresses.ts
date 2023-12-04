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
    FathomVault: '0xc06c2985607E12FAeD88733Af7891D3827E4E1b3',
    StrategyManager: '0xED32F71Ae7427F1Bb6E53aC8F3e1CD4B8427167C',
    SharesManager: '0xF3a519f793E41FB9bd13c5CC664b42cFB0889ee6',
    Governance: '0xde5E6d96aB5d558b2976B945e4e858Ca29842554',
    Setters: '0xbb221Fe259EB05197dc303C63Cb46b6C99208b99',
    blockNumber: '57400000',
    network: 'apothem'
  }