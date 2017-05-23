let expect = require('chai').expect;
let io = require('socket.io-client');

let app = require('../server');

let socketUrl = 'http://localhost:8010';

let options = {
    transports: ['websocket'],
    'force new connection': true
};

describe('Sockets', function () {

    it('should check if a user id is generated correctly', (done) => {

        // Set up client1 connection
        let client1 = io.connect(socketUrl, options);
        let client2 = io.connect(socketUrl, options);

        client1.emit('newPlayer', {y: 100});

        // when client1 is connected, connect client2
        client1.on('self', (data) => {
            expect(data.id).to.equal(0);
            client2.emit('newPlayer', {y: 120});
        });

        // client2 is connected, check its id
        client2.on('self', (data) => {
            expect(data.id).to.equal(1);
            client1.disconnect();
            client2.disconnect();
            done();
        });
    });

    it('should check if a user disconnect is done properly', (done) => {

        // Set up clients connections
        let client1 = io.connect(socketUrl, options);
        let client2 = io.connect(socketUrl, options);
        let client3 = io.connect(socketUrl, options);

        client1.emit('newPlayer', {y: 1});

        // Do this to synchronize clients
        // When client1 is ready, add client 2 and so on
        client1.on('self', (data) => client2.emit('newPlayer', {y: 2}));
        client3.on('self', () => client2.emit('requireSelf'));

        // from client3.disconnect()
        client2.on('remove', () => client2.emit('requireSelf'));

        let counter = 0;
        client2.on('self', (data) => {
            // console.log(data);
            counter++;

            if(counter == 1) {
                client3.emit('newPlayer', {y: 3});
            }

            // first for him and second for client3.on('self')
            if (counter == 2) {
                expect(data.front).to.equal(0);
                expect(data.behind).to.equal(2);
                client3.disconnect();
            }

            if(counter == 3) {
                // from client2.on('remove')
                expect(data.front).to.equal(0);
                expect(data.behind).to.equal(null);
                client1.disconnect();
                client2.disconnect();
                client3.disconnect();
                done();
            }
        });
    });

    it('should check if a user kill is done properly', (done) => {

        // Set up clients connections
        let client1 = io.connect(socketUrl, options);
        let client2 = io.connect(socketUrl, options);
        let client3 = io.connect(socketUrl, options);

        client1.emit('newPlayer', {y: 4});

        // Do this to synchronize clients
        // When client1 is ready, add client 2 and so on
        client1.on('self', (data) => client2.emit('newPlayer', {y: 5}));

        let counter = 0;
        client2.on('self', (data) => {
            // console.log(data);
            counter++;

            if(counter == 1) {
                client3.emit('newPlayer', {y: 6});
            }

            // once for him and twice for client3
            if (counter == 2) {
                expect(data.front).to.equal(0);
                expect(data.behind).to.equal(2);
                // kill first client
                client2.emit('removePlayer', 0);
            }

            if(counter == 3) {
                // from client2.on('remove')
                expect(data.front).to.equal(null);
                expect(data.behind).to.equal(2);
                client1.disconnect();
                client2.disconnect();
                client3.disconnect();
                done();
            }
        });

        client2.on('remove', (data) => {
            // from client3.disconnect()
            // console.log('Remove ' + data);
            client2.emit('requireSelf');
        });

        client3.on('self', () => client2.emit('requireSelf'));
    });

    it('should check if a user death is done properly', (done) => {

        // Set up clients connections
        let client1 = io.connect(socketUrl, options);
        let client2 = io.connect(socketUrl, options);
        let client3 = io.connect(socketUrl, options);

        client1.emit('newPlayer', {y: 7});

        // Do this to synchronize clients
        // When client1 is ready, add client 2 and so on
        client1.on('self', (data) => client2.emit('newPlayer', {y: 8}));
        client2.on('self', () => client3.emit('newPlayer', {y: 9}));

        client2.on('remove', (playerId) => {
            // kill self - client3 killed client2
            expect(playerId).to.equal(1);
            client3.emit('requireSelf');
        });

        let counter = 0;
        client3.on('self', (data) => {
            counter++;

            if(counter == 1) {
                client3.emit('removePlayer', 1);
            }

            if(counter == 2) {
                expect(data.front).to.equal(0);
                expect(data.behind).to.equal(null);
                client1.disconnect();
                client2.disconnect();
                client3.disconnect();
                done();
            }
        });
    });
});