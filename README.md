# RocketChat:Streamer
2 way communication over DDP with better performance.

## Installation
TODO

## Why
DDP subscriptions keeps track of all data each client has, it's called MergeBox, this is a lighter solution.

Use subscriptions to send data to client is not always easy to do, with **streamer** you can send data as simple as calling events.

## Use case
You should use this library when you want to send data from server to client of from client to server and prevent the server to keep track off data all clients have.

You can send a lot of data without performance problems, like notifications.

## Downsides
Since the library don't keep track of data, you will not receive lost data while offline after reconnection. But we have an event to notify you on reconnections passing the latest record received so you can call a method to verify and get the missing data.

TODO single server only

## Compatibility
Since **streamer** is based on DDP, we use subscriptions and methods to send data, it's 100% compatible with all DDP clients, more details below.

## Advantages over Arunoda's stream library
- Faster and use less memmory
  - For 2000 events and 10 mensages (40 thousand operations - send and reply)
    - rocketchat:streamer: ~34 seconds, increase of ~68mb of RAM
    - arunoda:meteor-stream: ~41 seconds, increase of ~76mb of RAM
  - For 10 events and 2000 mensages (40 thousand operations - send and reply)
    - rocketchat:streamer: ~32 seconds, increase of ~35mb of RAM
    - arunoda:meteor-stream: ~43 seconds, increase of ~80mb of RAM
- Read permission cached by event name by client at subscription time
- Don't use collection at client side (there is a compatible mode if you need)
- Last message cache and reconnection event
  - Keep the last message on client for each event name
  - You can get the last message and send to the server to verify if you lost messages


## How to use
A simple console chat

```javascript
const streamer = new Meteor.Streamer('chat');

if(Meteor.isClient) {
  sendMessage = function(message) {
    streamer.emit('message', message);
    console.log('me: ' + message);
  };

  streamer.on('message', function(message) {
    console.log('user: ' + message);
  });
}

if (Meteor.isServer) {
  streamer.allowRead('all');
  streamer.allowWrite('all');
}
```

Now you can open 2 browser tabs/windows and chat using `sendMessage("text")` at your browser's console
Every message will travel from your client to server and retransmited to all other clients.

### new Meteor.Streamer('name')
#### Client
```javascript
new Meteor.Streamer(name, [options])
```
- **name - String** REQUIRED Unique name to identify stream between server and client
- **options - Object** OPTIONAL
  - **useCollection - Boolean** Set to `true` to enable the compatible mode `default false`

#### Server
```javascript
const streamer = new Meteor.Streamer(name, [options]);
```
- **name - String** REQUIRED Unique name to identify stream between server and client
- **options - Object** OPTIONAL
  - **retransmit - Boolean** Set to false to prevent streaming "client to client" `default true`
  - **retransmitToSelf - Boolean** Set to true if you want to receive messages you've sent via _retransmit_ `default false`

### Permissions (Server only)
#### .allowRead('eventName', 'all')
```javascript
streamer.allowRead([eventName], permission);
```
- **eventName - String** OPTIONAL The event name to apply permissions, if not informed will apply the permission for all events
- **permission - Function/String** REQUIRED
  - **Function(eventName)** The function should return true to allow read
    - Param **eventName** The event name, useful when use one function to manage permissions for all events
    - Scope **this.userId** The id of the logged user
    - Scope **this.connection** The connection between client and server
  - **String** There are shortcuts for permissions
    - **all** Allow read for everyone
    - **none** Deny read for everyone
    - **logged** Allow read for logged users

```javascript
//Examples

streamer.allowRead('all'); // Everyone can read all events

streamer.allowRead('chat', 'logged'); // Only logged users can read chat events

streamer.allowRead('notifications', function() { // Only admin users can read notificaiton events
  if (this.userId) {
    const user = Meteor.users.findOne(this.userId);
    if (user && user.admin === true) {
      return true;
    }
  }
  
  return false;
});
```

#### .allowWrite('eventName', 'all')
```javascript
streamer.allowWrite([eventName], permission);
```
- **eventName - String** OPTIONAL The event name to apply permissions, if not informed will apply the permission for all events
- **permission - Function/String** REQUIRED
  - **Function(eventName, ...args)** The function should return true to allow write
    - Param **eventName** The event name, useful when use one function to manage permissions for all events
    - Scope **this.userId** The id of the logged user
    - Scope **this.connection** The connection between client and server
  - **String** There are shortcuts for permissions
    - **all** Allow write for everyone
    - **none** Deny write for everyone
    - **logged** Allow write for logged users

```javascript
//Examples

streamer.allowWrite('all'); // Everyone can write all events

streamer.allowWrite('chat', 'logged'); // Only logged users can write chat events

streamer.allowWrite('notifications', function(eventName, type) { // Only admin users can write notificaiton events
  if (this.userId && type === 'new-message') {                   // and only if the first param is 'new-message'
    const user = Meteor.users.findOne(this.userId);
    if (user && user.admin === true) {
      return true;
    }
  }
  
  return false;
});
```

### Compatibility mode
TODO
