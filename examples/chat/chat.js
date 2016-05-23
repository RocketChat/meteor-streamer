const streamer  = new Meteor.Streamer('chat');

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
}
