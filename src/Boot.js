class Boot {
  constructor() {
    console.log('Boot');
  }

  preload() {
    console.log('Boot - preload');
    this.game.load.image('loading', 'assets/loading.png');
  }

  create() {
    console.log('Boot - create');
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.game.state.start('Preload');
  }
}
