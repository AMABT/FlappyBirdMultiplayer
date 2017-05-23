let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io').listen(server);

// serve static resources
app.use('/src', express.static(__dirname + '/src'));
app.use('/assets', express.static(__dirname + '/assets'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

server.listen(process.env.PORT || 8010, function () {
    console.log('Listening on ' + server.address().port + '\n');
});

let lastPlayerID = 0;
let playersList = {};

io.on('connection', (socket) => {

    socket.on('newPlayer', (positionY) => {

        // create player object and attach it to socket
        let player = {
            id: lastPlayerID++,
            front: null, // id of player in front of current user
            behind: null,
            position: 0,
            y: positionY
        };

        addPlayer(player);

        // socket.emit -> send to connected client
        // emit allplayers to send to the new user all the previous clients
        socket.emit('self', player);
        socket.emit('getOpponents', getOpponents(player.id));

        // socket.broadcast.emit -> send to all clients except the connected one
        // signal to all the other clients (except this) that a new user has connected
        socket.broadcast.emit('newPlayer', player);

        socket.on('requireSelf', () => socket.emit('self', player));
        socket.on('requireOpponents', () => socket.emit('getOpponents', getOpponents(player.id)));

        // when this user moves, signal to all the others
        socket.on('jump', (data) => {
            player.y = data.y;
            socket.broadcast.emit('jump', player);
        });

        // when this user fires, signal to all the others
        socket.on('fire', () => socket.broadcast.emit('fire', player.id));

        socket.on('removePlayer', (playerID) => {
            removePlayer(playerID);
            io.emit('remove', playerID);
        });
        socket.on('disconnect', () => {
            removePlayer(player.id);
            io.emit('remove', player.id);
        });
    });
});

function addPlayer(player) {
    // make connections
    Object.keys(playersList).forEach((playerID) => {
        playerID = parseInt(playerID);
        // search for the last player added and make the connection to current one
        if (playerID != player.id && playersList[playerID].behind === null) {
            playersList[playerID].behind = player.id;
            player.front = playerID;
        }
    });

    playersList[player.id] = player;
}

function removePlayer(playerID) {

    if (!playersList.hasOwnProperty(playerID)) {
        return false;
    }

    // console.log('Remove ' + playerID);

    let player = playersList[playerID];
    let front = playersList[player.front];
    let behind = playersList[player.behind];

    // recreate connections
    if (front === undefined && behind !== undefined) {
        behind.front = null;
    }
    if (behind === undefined && front !== undefined) {
        front.behind = null;
    }
    if (front !== undefined && behind !== undefined) {
        front.behind = behind.id;
        behind.front = front.id;
    }

    delete playersList[playerID];

    if (Object.keys(playersList).length === 0) {
        // When there are no more users, reset index - useful for testing
        lastPlayerID = 0;
    }
}

/**
 * Return all clients except current one
 * @param playerID
 * @returns {Array}
 */
function getOpponents(playerID) {

    let player = playersList[playerID];
    let players = [];

    if (player === undefined) {
        return players;
    }

    if (playersList[player.front]) {
        let opponent = Object.assign({}, playersList[player.front]);
        opponent.position = 1;
        players.push(opponent);
    }

    if (playersList[player.behind]) {
        let opponent = Object.assign({}, playersList[player.behind]);
        opponent.position = -1;
        players.push(opponent);
    }

    return players;
}