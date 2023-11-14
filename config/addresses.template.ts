// AS compiler does not like interface
export class Addresses {
    FathomVault: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    FathomVault: '{{FathomVault}}',
    blockNumber: '{{blockNumber}}',
    network: '{{network}}'
  }