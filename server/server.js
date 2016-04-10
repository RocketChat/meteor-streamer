/* globals test:true, radio:true */
/* exported radio, test */

radio = new Meteor.Radio('chat');

radio.transform('sum', function(a, b) {
	return a + b;
});

radio.transform('logged', function() {
	return !!this.userId;
});

radio.transform('userId', function() {
	return this.userId;
});

radio.transform('only-logged', function() {
	return !!Meteor.userId();
});

radio.transform('only-logged2', function() {
	return !!this.userId;
});


radio.allowRead(function(eventName) {
	if (eventName === 'only-logged-reply') {
		return !!this.userId;
	}

	if (eventName === 'only-logged2-reply') {
		return !!this.userId;
	}

	return true;
});

radio.allowWrite(function(eventName) {
	if (eventName === 'only-logged2') {
		return !!this.userId;
	}

	return true;
});
