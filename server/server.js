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


streamer.allowRead(function(eventName) {
	if (eventName === 'only-logged-reply') {
		return !!this.userId;
	}

	if (eventName === 'only-logged2-reply') {
		return !!this.userId;
	}

	return true;
});

streamer.allowWrite(function(eventName) {
	if (eventName === 'only-logged2') {
		return !!this.userId;
	}

	return true;
});
