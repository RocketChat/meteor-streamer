/* globals EV:true */
/* exported EV */

EV = class EV {
	constructor() {
		this.handlers = {};
	}

	emit(event) {
		const args = Array.prototype.slice.call(arguments, 1);

		if (this.handlers[event]) {
			for(let lc=0; lc < this.handlers[event].length; lc++) {
				const handler = this.handlers[event][lc];
				handler.apply(this, args);
			}
		}
	}

	on(event, callback) {
		if (!this.handlers[event]) {
			this.handlers[event] = [];
		}
		this.handlers[event].push(callback);
	}

	once(event, callback) {
		self.on(event, function onetimeCallback() {
			callback.apply(this, arguments);
			self.removeListener(event, onetimeCallback);
		});
	}

	removeListener(event, callback) {
		if(this.handlers[event]) {
			const index = this.handlers[event].indexOf(callback);
			if (index > -1) {
				this.handlers[event].splice(index, 1);
			}
		}
	}

	removeAllListeners(event) {
		this.handlers[event] = undefined;
	}
};
