const streamer = new Meteor.Streamer('chat');


if (Meteor.isClient) {
    const messages = new Mongo.Collection(null);

    window.sendMessage = function (text) {
        streamer.emit('message', {
            type: 'user',
            user: Meteor.user() ? Meteor.user().username : 'anonymous',
            text: text
        });
        messages.insert({
            type: 'self',
            text: text
        });
    };

    streamer.on('message', function (message) {
        messages.insert(message);
    });

    Template.body.events({
        'keydown input'(e) {
            if (e.which === 13) {
                window.sendMessage(e.target.value);
                e.target.value = '';
            }
        }
    });

    Template.body.helpers({
        messages() {
            return messages.find();
        }
    });
}

if (Meteor.isServer) {
    streamer.allowRead('all');
    streamer.allowWrite('all');

    if (Meteor.settings.public.function === "clientServer") {

        remote = 'http://192.168.1.11:3000';
        networkStreamer = new Meteor.SvrStreamer('network', remote);

        sendMessage = function (text) {
            networkStreamer.emit('networkMessage', text);
        };

        networkStreamer.on('networkMessage', function (message) {
            console.log('received by clientServer', message);
        });

        Meteor.setInterval(function () {
            console.log('sent by clientServer ');
            sendMessage('sent by clientServer');

        }, 2000)


    } else if (Meteor.settings.public.function === "serverServer") {

        networkStreamer = new Meteor.Streamer('network');

        networkStreamer.allowRead('all');
        networkStreamer.allowWrite('all');

        sendMessage = function (text) {
            networkStreamer.emit('networkMessage', text);
        };

        networkStreamer.on('networkMessage', function (message) {
            console.log('received bt serverServer', message.text);
        });

        Meteor.setInterval(function () {
            console.log('sent by serverServer ');
            sendMessage('sent by serverServer');
        }, 2000);
    }
}
