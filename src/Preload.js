class Preload {
  constructor() {
    console.log('Preload');
  }

  preload() {
    console.log('Preload - preload');
    var loadingBar = this.add.sprite(160, 240, 'loading');
    loadingBar.anchor.setTo(0.5, 0.5);
    this.load.setPreloadSprite(loadingBar);
    // let game = this.game;
    this.load.image('airplane', 'assets/airplane.png');
    this.load.image('bullet', 'assets/bullet.png');
    this.load.image('pipe', 'assets/pipe.png');
    this.load.image('background', 'assets/background.png');
  }

  create() {
    console.log('Preload - create');
    this.game.state.start('Main');
  }
}