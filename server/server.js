/* globals test:true, radio:true */
/* exported radio, test */

radio = new Meteor.Radio('chat');

function onAndReply(eventName, cb) {
	radio.on(eventName, function(...args) {
		radio.emit(eventName+'-reply', 'server-reply', ...cb.apply(this, args));
	});
}

onAndReply('hi', function(...args) {
	return args;
});

onAndReply('sum', function(a, b) {
	return a + b;
});

onAndReply('logged', function() {
	return !!this.userId;
});

onAndReply('userId', function() {
	return this.userId;
});

onAndReply('only-logged', function() {
	return !!this.userId;
});

onAndReply('only-logged2', function() {
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
