class Main {

    constructor() {
        console.log('Airplane');
    }

    create() {
        console.log('Airplane - create');

        //  setup world
        let game = this.game;
        game.world.setBounds(0, 0, 992, 480);
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.stage.disableVisibilityChange = true;

        // setup background
        let bgWidth = game.cache.getImage('background').width;
        bgWidth *= game.width / game.height;
        game.background = game.add.tileSprite(0, 0, bgWidth, game.height, 'background');
        game.background.height = game.height;

        // setup airplane for current user
        let airplaneX = game.width / 2;
        let airplaneY = game.height / 2;
        let airplane = this.airplane = new Airplane(game, airplaneX, airplaneY, -1);
        game.add.existing(airplane);

        // position for airplanes in front and behind current user
        this.positionBehind = airplaneX - 200;
        this.positionFront = airplaneX + 200;

        // Keep track of score on the upper left corner
        this.score = 0;
        this.labelScore = game.add.text(20, 20, "0", {
            font: "30px Arial",
            fill: "#fff"
        });

        // call the jump function when tapping on the screen or hitting the space key
        this.input.onDown.add(this.jumpCurrent, this);
        game.input
            .keyboard.addKey(Phaser.Keyboard.SPACEBAR)
            .onDown.add(this.jumpCurrent, this);

        // when to fire bullets from airplane
        let fireButton = game.input.keyboard.addKey(Phaser.Keyboard.ALT);
        fireButton.onDown.add(this.fireCurrent, this);

        //  our bullet group
        let bullets = this.bullets = game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(30, 'bullet');
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 1);
        bullets.setAll('outOfBoundsKill', true);
        bullets.setAll('checkWorldBounds', true);

        // obstacles for airplane
        this.pipes = this.game.add.group();
        //this.timer = this.game.time.events.loop(1500, this.addColumnOfPipes, this);

        // multi player map
        this.playerMap = {};
        this.client = new Client(this);
        this.client.askNewPlayer(airplaneY);
    }

    /**
     * This function contains the game logic.
     * It gets called 60 times per second.
     */
    update() {
        // scroll background
        this.game.background.tilePosition.x -= 2;

        this.game.physics.arcade.overlap(
            this.airplane,
            this.pipes,
            this.hitPipe,
            null,
            this
        );

        // update players
        this.updatePlayer(this.airplane);

        for (let key in this.playerMap) {

            let player = this.playerMap[key];

            this.updatePlayer(player);

            this.game.physics.arcade.overlap(
                this.bullets,
                player,
                this.hitTarget,
                null,
                this
            );
        }
    }

    updatePlayer(player) {

        // Restart the game if the airplane is off the screen limits
        if (player.y < 0 || player.y > this.game.height) {
            this.restartGame(player);
        }
    }

    jumpCurrent() {
        let player = this.airplane;
        this.client.jumpPlayer(player.y);
        player.jump();
    }

    jumpPlayer(id, y) {
        let player = this.playerMap[id];
        if (player === undefined) {
            console.debug('player ' + id + ' not found');
            return false;
        }
        player.jump();
    }

    restartGame(player) {
        //this.killSelf();
        // prevent it from going down
        player.y = this.game.height;
        player.angle = 0;
        player.body.velocity.y = 0;
        // this.client.removeSelf();
    }

    /**
     * Get first bullet and set its direction & speed
     * @returns {boolean}
     */
    fire(x, y) {
        let bullet = this.bullets.getFirstExists(false);
        if (!bullet)
            return false;

        bullet.reset(x + 50, y - 5);
        // this.game.physics.arcade.velocityFromRotation(1 * Math.PI / 180, 400, bullet.body.velocity);
        this.game.physics.arcade.enable(bullet);
        bullet.body.velocity.x = 400;
        bullet.body.velocity.y = -100;
        bullet.body.gravity.y = 150;
    }

    fireCurrent() {
        this.fire(this.airplane.x, this.airplane.y);
        this.client.fire();
    }

    firePlayer(playerID) {
        let player = this.playerMap[playerID];
        if (player)
            this.fire(player.x, player.y);
    }

    /**
     *
     * @param {Airplane} target
     * @param bullet
     */
    hitTarget(target, bullet) {
        this.client.killPlayer(target.playerID);
        this.score++;
        this.labelScore.text = this.score;
        target.kill();
        console.debug('Target hit', target.playerID);
    }

    addOnePipe(x, y) {
        // Create a pipe at the position x and y
        let pipe = this.game.add.sprite(x, y, 'pipe');

        // Add the pipe to our previously created group
        this.pipes.add(pipe);

        // Enable physics on the pipe
        this.game.physics.arcade.enable(pipe);

        // Add velocity to the pipe to make it move left
        pipe.body.velocity.x = -200;

        // Automatically kill the pipe when it's no longer visible
        pipe.checkWorldBounds = true;
        pipe.outOfBoundsKill = true;
    }

    /**
     * Create full column of obstacles
     */
    addColumnOfPipes() {
        // Increase the score by 1 every time a new row of pipes gets created
        this.score++;
        this.labelScore.text = this.score;

        // Randomly pick a number between 1 and 5
        // This will be the hole position
        let hole = Math.floor(Math.random() * 5) + 1;

        // Add the 6 pipes
        // With one big hole at position 'hole' and 'hole + 1'
        for (let i = 0; i < 9; i++) {
            if (i != hole && i != hole + 1) {
                this.addOnePipe(900, i * 60 + 10);
            }
        }
    }

    hitPipe() {
        // If the airplane has already hit a pipe, do nothing
        // It means the airplane is already falling off the screen
        if (!this.airplane.alive) {
            return;
        }

        this.airplane.alive = false;

        // Prevent new pipes from appearing
        this.game.time.events.remove(this.timer);

        // Go through all the pipes, and stop their movement
        this.pipes.forEach((p) => {
            p.body.velocity.x = 0;
        });
    }

    addNewPlayer(id, position, y) {
        this.playerMap[id] = new Airplane(this.game, position > 0 ? this.positionFront : this.positionBehind, y, id);
        this.game.add.existing(this.playerMap[id]);
    }

    clearOpponents() {
        let players = this.playerMap;
        Object.keys(players).forEach((id) => {
            this.removePlayer(id);
        });
        players = {};
    }

    removePlayer(id) {
        console.debug('remove ' + id);
        //this.playerMap[id].kill();
        delete this.playerMap[id];
    }

    killSelf() {
        console.log('Kill self');
        this.game.state.start('Main');
    }
}
