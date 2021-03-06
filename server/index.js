const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');
const {  addUser,removeUser,getUser,getUsersInRoom } = require('./users.js');

const PORT = process.env.PORT || 5000;

const router = require('./router');

const app = express();  
const server = http.createServer(app);
const io = socketio(server);

app.use(cors());
app.use(router);


io.on('connection',(socket)=>{
    // console.log('We have a new connection');
    socket.on('join',({name,room}, callback)=>{
      // console.log(name,room);
      const {error, user} = addUser ({id: socket.id , name, room});
      if(error) return callback(error);

      // for letting the loged in user know that he has joined the room
      socket.emit ('message' , { user:'admin', text: `${user.name}, welcome to the room ${user.room}`});
       
      // for letting everyone else know that user has joined
      socket.broadcast.to(user.room).emit('message', {user:'admin', text: `${user.name}, has joined`});

      socket.join(user.room);
 
      io.to(user.room).emit('roomData',{room: user.room, users: getUsersInRoom(user.room)})



      callback();
    });

     socket.on('sendMessage', (message, callback)=>{
       const user = getUser(socket.id);
       io.to(user.room).emit('message', {user:user.name, text:message});
       callback();
     })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if(user) {
          io.to(user.room).emit('message',{user:'admin', text :`${user.name} has left !!`})
          io.to(user.room).emit('roomData',{room:user.room, users: getUsersInRoom(user.room)});
        }
    });

})



server.listen(PORT,()=>
  console.log(`Server has started on port ${PORT}`)
);