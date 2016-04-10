const streamer = new Meteor.Streamer('test', {retransmitToSelf: true});

if (Meteor.isClient) {
	const call = (eventName, params, paramsReply) => {
		streamer.once(eventName, (...args) => {
			if (JSON.stringify(args) === JSON.stringify(paramsReply)) {
				console.log('√', eventName, args);
			} else {
				console.warn('X', eventName, args);
			}
		});
		streamer.emit(eventName, ...params);
	};

	window.test = () => {
		call('hi', [1, 2, 3], [1, 2, 3]);
		call('sum', [2, 3], [5]);
		call('logged', [], [!!Meteor.userId()]);
		call('only-logged', [], [true]);
		call('only-logged2', [], [true]);
		call('userId', [], [Meteor.userId()]);
	};

	setTimeout(window.test, 1000);

	streamer.onReconnect(function() {
		window.test();
	});
}

if (Meteor.isServer) {
	streamer.transform('sum', function(a, b) {
		return a + b;
	});

	streamer.transform('logged', function() {
		return Boolean(this.userId);
	});

	streamer.transform('userId', function() {
		return this.userId;
	});

	streamer.transform('only-logged', function() {
		return Boolean(Meteor.userId());
	});

	streamer.transform('only-logged2', function() {
		return Boolean(this.userId);
	});

	streamer.allowRead('all');
	streamer.allowWrite('all');

	streamer.allowRead('only-logged', 'logged');
	streamer.allowWrite('only-logged', 'logged');

	streamer.allowRead('only-logged2', 'all');
	streamer.allowWrite('only-logged2', 'logged');
}
