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
    FathomVault: '0xec939f6F7872964cEE50d6aEAD85E743d33c54AA',
    Factory: '0x63ffBb580AFF9d68d7893a6f9594ED588B848e82',
    Accountant: '0xfC116b95DFF3c017949E02a59af9fA7F7159a887',
    blockNumber: '58600233',
    network: 'apothem'
  }