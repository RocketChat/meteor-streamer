# RocketChat:Streamer
2 way communication over DDP with better performance.

## Installation
```shell
meteor add rocketchat:streamer
```

## Documentation
[package documentation](https://github.com/RocketChat/meteor-streamer/blob/master/packages%2Frocketchat-streamer%2FREADME.md)


## History

### 1.0.2 (2019-05-19)
* Do not use `super` to call parent classes (fix for Edge browser)

### 1.0.1 (2018-10-24)
* Throw an error if subscribe not allowed

### 1.0.0 (2018-10-24)
* Allow better way to override publish method
* Avoid multiple `DDPCommon.stringifyDDP` for multiple subscriptions
* Refactor to call `unsub` on `removeListener`

### 0.5.0 (2016-06-07)
* Add a new method to control data flow `allowEmit`

### 0.4.0 (2016-05-21)
* Added optional ddpConnection to Streamer constructor

### 0.3.5 (2016-05-02)
* Fix some ES6 errors

### 0.3.4 (2016-05-01)
* Remove all listeners on unsubscribe
