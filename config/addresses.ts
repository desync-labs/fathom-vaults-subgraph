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
    FathomVault: '0x15e40f8b24E46032149cd6dc75ebe8766C7F6182',
    StrategyManager: '0x8Bb5367F7DB3878ABC6767cB5A98E3FBCFc2645E',
    SharesManager: '0xeC6f2deb13AF4CEdEB84BC1a425A302D25AC8dD2',
    Governance: '0x1a3A2AeFF4E322d672aF2f3D1E20ca2F2F256921',
    Setters: '0x0c472FAABD59465Ec1955CA65f77763AA3eCd27c',
    blockNumber: '57750000',
    network: 'apothem'
  }