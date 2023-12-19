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
    FathomVault: '0x06BccADd65E50fC8fFbF16f62891b7d4e26bEFFB',
    StrategyManager: '0x699d806A62287dB249A568525F791d37c99A5307',
    SharesManager: '0x8c892F0dEE6E599f22B83688E23D074b9eaCa2cb',
    Governance: '0x5e3dC0352eE37bd420BC0950C3B7A6c56A0d902a',
    Setters: '0x66cc60dd0cbD3D59Fc16e92f5Af22d26A38100cB',
    blockNumber: '57980000',
    network: 'apothem'
  }