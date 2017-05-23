class Client {

    /**
     *
     * @param {Main} gameState
     */
    constructor(gameState) {

        this.clientId = null;
        let socket = this.socket = io.connect({'forceNew': true});

        console.log('connecting to server');

        socket.on('self', (data) => {
            console.log('self id', data.id);
            this.clientId = data.id;
        });

        socket.on('newPlayer', (data) => {
            console.log('client received newPlayer', data);
            socket.emit('requireOpponents');
        });

        socket.on('getOpponents', function (data) {
            console.log('client received all opponents', data);
            gameState.clearOpponents();
            for (let i = 0; i < data.length; i++) {
                gameState.addNewPlayer(data[i].id, data[i].position, data[i].y);
            }
        });

        socket.on('jump', (data) => {
            gameState.jumpPlayer(data.id, data.y);
        });

        socket.on('fire', (playerId) => {
            gameState.firePlayer(playerId);
        });

        socket.on('remove', (id) => {
            if (this.clientId == id) {
                socket.disconnect();
                gameState.killSelf();
            } else {
                gameState.removePlayer(id);
                socket.emit('requireOpponents');
            }
        });
    }

    askNewPlayer(positionY) {
        console.log('Ask new player');
        this.socket.emit('newPlayer', positionY);
    }

    jumpPlayer(y) {
        this.socket.emit('jump', y);
    }

    fire() {
        this.socket.emit('fire');
    }

    removeSelf() {
        console.log('Remove self');
        this.socket.disconnect();
    }

    killPlayer(playerID) {
        console.log('Kill', playerID);
        this.socket.emit('removePlayer', playerID);
    }
}