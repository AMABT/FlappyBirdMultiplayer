class Airplane extends Phaser.Sprite {

    constructor(game, x, y, playerID) {

        super(game, x, y, 'airplane');

        this.game = game;
        this.playerID = playerID;
        this.anchor.setTo(-0.2, 0.5);
        game.physics.arcade.enable(this);
        this.body.gravity.y = 400; // 800 normal
    }

    update() {
        
        if (this.angle < 20) {
            this.angle += 1;
        }
    }

    jump() {

        if (!this.alive) {
            return;
        }

        // Actual jump
        this.body.velocity.y = -350;

        // Animate the airplane when it jumps
        this.game.add.tween(this)
            .to({angle: -20}, 100)
            .start();
    }

}