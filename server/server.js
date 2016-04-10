/* globals streamer:true */
/* exported streamer */

streamer = new Meteor.Streamer('chat');

streamer.transform('sum', function(a, b) {
	return a + b;
});

streamer.transform('logged', function() {
	return !!this.userId;
});

streamer.transform('userId', function() {
	return this.userId;
});

streamer.transform('only-logged', function() {
	return !!Meteor.userId();
});

streamer.transform('only-logged2', function() {
	return !!this.userId;
});

streamer.allowRead('all');
streamer.allowWrite('all');

streamer.allowRead('only-logged', 'logged');
streamer.allowWrite('only-logged', 'logged');

streamer.allowRead('only-logged2', 'all');
streamer.allowWrite('only-logged2', 'logged');
