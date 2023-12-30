// AS compiler does not like interface
export class Addresses {
    FathomVault: string
    blockNumber: string
    network: string
  }
  
  // AS compiler does not like const
  export let addresses: Addresses = {
    FathomVault: '0x40d0A678e55a7c2f78247d456Eb9A7028c54d291',
    blockNumber: '58290275',
    network: 'apothem'
  }