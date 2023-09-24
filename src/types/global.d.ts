export {};

declare global {
  /**
   * Now declare things that go in the global namespace,
   * or augment existing declarations in the global namespace.
   */
  var contractInteraction: any;
  var ethers: any;
  var GAME_CONTRACT_ADDRESS: string
  var GAME_ASSETS: any
  var wallet: any
  var loadNoti: any;
  var localStorage: any;

  var provider: any;
  var formatAddress : function;

  interface Window {
    callBackLoadResourcesComplete: function;
  }
}
