Meteor.streamer = new Meteor.Streamer('performance-rocket');
Meteor.stream = new Meteor.Stream('performance-arunoda');

Meteor.stream.permissions.read(function() {
	return true;
});

Meteor.stream.permissions.write(function() {
	return false;
});

Meteor.methods({
	'memory-sample'() {
		return process.memoryUsage().rss;
	},

	'register-rocket'(n) {
		for (let i = 1; i <= n; i++) {
			Meteor.streamer.on(`event-${i}`, function(value, obj) {
				Meteor.streamer.emit(`event-${i}-reply`, value, obj);
			});
		}
	},

	'register-arunoda'(n) {
		for (let i = 1; i <= n; i++) {
			Meteor.stream.on(`event-${i}`, function(value, obj) {
				Meteor.stream.emit(`event-${i}-reply`, value, obj);
			});
		}
	}
});
