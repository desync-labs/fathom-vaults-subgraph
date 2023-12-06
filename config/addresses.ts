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
    FathomVault: '0x223d5ea594971195b7ef8F0593500d2f59E4B7d3',
    StrategyManager: '0xAAfD08F178634F031d2e514261175995A1E91dC8',
    SharesManager: '0x3C1FDB4342C0443aa9D8A3803c3981F149b9BDDc',
    Governance: '0x850337Cd0441B5B0059103aBC5c7E15079F4812A',
    Setters: '0xD8E148D42CAfbff410B470A7382E9db9B9Ec5Ed5',
    blockNumber: '57580000',
    network: 'apothem'
  }