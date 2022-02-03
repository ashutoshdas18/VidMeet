const express = require('express');
const {Server} = require('socket.io');


const app = express();
const server = app.listen(3000);
const io = new Server(server);
var m = new Map();

app.use(express.static(__dirname+'/src/'))

io.on('connection',socket=>{
  socket.on('connected',(roomName,uname)=>{
    socket.join(roomName);
    socket.roomName = roomName;
    socket.name = uname;
    if(m.has(roomName))
    {
      const set = new Set();
      const id =socket.id;
      const nameSet = {[id]:uname}
      m.get(roomName).push(nameSet);
    }
    else{
      const id =socket.id;
      const nameSet = {[id]:uname}
      m.set(roomName,[nameSet])
    }
    socket.to(roomName).emit('joined',uname);
    io.sockets.to(roomName).emit('user-joined',socket.id,io.sockets.adapter.rooms.get(roomName).size,[...io.sockets.adapter.rooms.get(roomName).keys()],[...m.get(roomName)])
  }) 
  socket.on('signal',(id,msg)=>{
    io.to(id).emit('signal',socket.id,msg)
  })
  socket.on('disconnect',()=>{
    if(m.get(socket.roomName)!=undefined)
    {
      m.get(socket.roomName).forEach(e=>{
        if(Object.keys(e)[0]===socket.id)
        {
          m.get(socket.roomName).splice( m.get(socket.roomName).indexOf(e),1);
        }
      })
    }    
    io.sockets.to(socket.roomName).emit('disconnected',socket.id,socket.name);
  })
  socket.on('chat-recieved',(chat,Uname)=>{
    console.log(Uname+":"+chat)
    io.sockets.to(socket.roomName).emit('chat-recieved',chat,Uname)
  })
})