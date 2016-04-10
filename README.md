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
TODO Basic Usage

### Client side
TODO

### Server side
TODO

### Permissions
TODO

### Compatibility mode
TODO
