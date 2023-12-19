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
    FathomVault: '0xEd4e0f720E5C7b409492DE967d2da0e9dd24b8C9',
    StrategyManager: '0xE5D8b20Cf1B1FCf7190EA992f57185aaa4b78Dcb',
    SharesManager: '0xcdc41A34DD91AEBc86Cab288a1368021bB2A8D6a',
    Governance: '0xd1402674Bb51D6b9d051Cf620778054C5a17801b',
    Setters: '0x3E2E59165111c2F181583cB5Bca59852643Ec7C8',
    blockNumber: '57960000',
    network: 'apothem'
  }