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
    FathomVault: '0x6b2d4f6Abb645162128b19053408B88531094Dd9',
    StrategyManager: '0x108D0a90aF337045FD031E256FC64d4D84D60Cc2',
    SharesManager: '0x940CC73B07DF0B47E1382BDB631EA77D664fc5bf',
    Governance: '0x90D54C32629074958B87fde6023d228962396545',
    Setters: '0xea82398fF212A223610963c3D166441D7dcAb45e',
    blockNumber: '58020000',
    network: 'apothem'
  }