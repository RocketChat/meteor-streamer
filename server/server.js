const streamer = new Meteor.Streamer('test', {retransmitToSelf: true});

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
