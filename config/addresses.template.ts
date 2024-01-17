// AS compiler does not like interface
export class Addresses {
    Factory: string
    Accountant: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    Factory: '{{Factory}}',
    Accountant: '{{Accountant}}',
    blockNumber: '{{blockNumber}}',
    network: '{{network}}'
  }