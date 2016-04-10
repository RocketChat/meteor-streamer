/* globals test, radio:true */
/* exported radio, test */

radio = new Meteor.Radio('chat');
let testResult = [];
const testResultReactive = new ReactiveVar();

function addTestResult(text, ok) {
	testResult.push({
		type: ok === true ? 'success' : 'failure',
		sign: ok === true ? '√' : 'X',
		text: text
	});

	testResultReactive.set(testResult);
}

function call(eventName, params, paramsReply) {
	radio.once(eventName, (...args) => {
		addTestResult(eventName + ' - ' + JSON.stringify(args), JSON.stringify(args) === JSON.stringify(paramsReply));
	});
	radio.emit(eventName, ...params);
}

function test() {
	testResult = [];
	call('hi', [1, 2, 3], [1, 2, 3]);
	call('sum', [2, 3], [5]);
	call('logged', [], [!!Meteor.userId()]);
	call('only-logged', [], [true]);
	call('only-logged2', [], [true]);
	call('userId', [], [Meteor.userId()]);
}

Template.body.events({
	'click .start-test'() {
		test();
	}
});

Template.body.helpers({
	testResult() {
		return testResultReactive.get();
	}
});

setTimeout(test, 1000);

radio.onReconnect(function() {
	test();
});
