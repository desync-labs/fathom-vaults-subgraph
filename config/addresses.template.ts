// AS compiler does not like interface
export class Addresses {
    FathomVault: string
    Factory: string
    Accountant: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    FathomVault: '{{FathomVault}}',
    Factory: '{{Factory}}',
    Accountant: '{{Accountant}}',
    blockNumber: '{{blockNumber}}',
    network: '{{network}}'
  }