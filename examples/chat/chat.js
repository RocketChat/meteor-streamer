const streamer = new Meteor.Streamer('chat');


if(Meteor.isClient) {
	const messages = new Mongo.Collection(null);

	window.sendMessage = function(text) {
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

	streamer.on('message', function(message) {
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


    if (Meteor.settings.public.function === "host") {

        const mess_Host = new Mongo.Collection(null);

        remote = 'http://192.168.1.11:3000';
        networkStreamer = new Meteor.SvrStreamer('network', remote);

        sendMessage = function(text) {
            networkStreamer.emit('networkMessage', text);
        };

        networkStreamer.on('networkMessage', function(message) {
            console.log('received by host', message);
        });

        Meteor.setInterval(function (){
            console.log('sent by host ');
            sendMessage('sent by host');

        },2000)

        
    } else {  //network

        networkStreamer = new Meteor.Streamer('network');

        networkStreamer.allowRead('all');
        networkStreamer.allowWrite('all');
        networkStreamer.allowWrite('mess', 'all');

            sendMessage = function(text) {
                networkStreamer.emit('networkMessage', text);
            };

            networkStreamer.on('networkMessage', function(message) {
                console.log('received bt network', message.text);
            });

                Meteor.setInterval(function (){
                    console.log('sent by server ');
                    sendMessage('sent by server');
                },2000);
    }


}
