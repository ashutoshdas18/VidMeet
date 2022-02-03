var connection = [],stream,socket=io();
var local = document.querySelector('#local');
var endCall = document.querySelector('.endCallBtn');
var screen = document.querySelector('.noScreenShare');
var flash = document.querySelector('.welcomeUser');
var chatForm = document.querySelector('.bottomForm');
var chatReceived = document.querySelector('.chats');
var chatBox = document.querySelector('.users');
var Uname = window.location.search.split('=')[1].split('&')[0];
var roomName = window.location.search.split('=')[2];
var color = ['#318991','#977fd7',' #D15683','magenta','#1E2050']
var vidStream; 
navigator.mediaDevices.getUserMedia({audio:true,video:true}).then(data=>{
    stream = data;
    local.srcObject = data;
}).then(()=>{
     socket.emit('connected',roomName,Uname)
})
socket.on('user-joined',async (newUserId,userCount,userList,userNames)=>{
    userList.forEach(socketIds =>{
        if(!connection[socketIds])
        {
            userNames.forEach(e=>{
                if(Object.keys(e)[0]===socketIds)
                {
                    var chatNameContainer= document.createElement('div');
                    var chatName = document.createElement('p');
                    var chatImg = document.createElement('div');
                    chatImg.style.backgroundColor = color[Math.floor(Math.random()*5)]
                    chatImg.innerHTML= e[socketIds].charAt(0);
                    chatName.innerHTML = e[socketIds];
                    chatNameContainer.id = `${socketIds}+${e[socketIds]}`;
                    chatName.style.color="white";
                    chatNameContainer.appendChild(chatName);
                    chatNameContainer.appendChild(chatImg);
                    chatBox.appendChild(chatNameContainer);
                }
            })
            connection[socketIds] = new RTCPeerConnection();
            connection[socketIds].onicecandidate = e=>{
                if(e.candidate)
                {
                    socket.emit('signal',newUserId,JSON.stringify({'ice':e.candidate}))
                }
            }
            connection[socketIds].ontrack = e=>{
                vidStream = e.streams[0];

                console.log(vidStream)
                if(document.querySelector(`.${socketIds}-container`)!==null)
                {
                    document.getElementById(`${socketIds}-video`).srcObject = vidStream
                    document.getElementById(`${socketIds}-video`).play();
                }
                else{
                var vidContainer = document.createElement('div');
                vidContainer.className = "videoContainer";
                vidContainer.classList.add(`${socketIds}-container`);
                document.querySelector('.videoSection').appendChild(vidContainer);
                var v = document.createElement('video');
                v.id = `${socketIds}-video`;
                var container = '.'+socketIds+'-container';
                document.querySelector(container).appendChild(v);
                v.srcObject = vidStream;
                v.play();
                }
                
                
                
            }
            connection[socketIds].addTrack(stream.getTracks()[0],stream);
            connection[socketIds].addTrack(stream.getTracks()[1],stream);
        }
    })
    if(userCount>=2)
    {
        let offer = await  connection[newUserId].createOffer()
        await connection[newUserId].setLocalDescription(offer);
        socket.emit('signal',newUserId,JSON.stringify({'sdp':await connection[newUserId].localDescription}))
       
    }
})

socket.on('signal',(id,msg)=>{
   
    if(id!=socket.id)
    {
        var sig = JSON.parse(msg);
        if(sig.sdp)
        {
            
            connection[id].setRemoteDescription(new RTCSessionDescription(sig.sdp)).then(async ()=>{
                if(sig.sdp.type === 'offer')
                {
                    var answer= connection[id].createAnswer()
                    await connection[id].setLocalDescription(answer);
                    socket.emit('signal',id,JSON.stringify({'sdp': await connection[id].localDescription}))
                   
                }
            })
        }
        else if(sig.ice)
        {
            connection[id].addIceCandidate(new RTCIceCandidate(sig.ice)).catch(e => console.log(e));
        }
    }
})

socket.on('joined',(nameOfUser)=>{
    flash.innerHTML = nameOfUser+" has joined";
    flash.style.display="block";
    flash.style.opacity ="1";
    setTimeout(function(){
        flash.style.display="none";
    flash.style.opacity ="0";
    },5000)
})

socket.on('disconnected',(sid,name)=>{
    let id = '.'+sid+'-container';
    if(document.querySelector(id)!=null){
        document.querySelector('.videoSection').removeChild(document.querySelector(id));
    }
    let chatId = `${sid}+${name}`;
    chatBox.removeChild(document.getElementById(chatId))
})

document.querySelector('.videoSection').addEventListener('click',e=>{
    if(e.target.nodeName === 'VIDEO')
    {
    let vidId = e.target.id;
   document.getElementById(vidId).requestFullscreen()
    }
   
})

endCall.addEventListener('click',()=>{
    location.href="/index.html"
})


screen.addEventListener('click',e=>{
    navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: "always"
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
        }
    }).then(screenTrack=>{
        local.srcObject= screenTrack;
        local.style.transform="scaleX(1)"
        screenTrack.trackType = "record";
        replace(screenTrack,true);
    })
})

function replace(Screentrack,mirror)
{
    for(i in connection)
    {
        var track = connection[i].getSenders().find(streams=>streams.track.kind === 'video');
        track.replaceTrack(Screentrack.getVideoTracks()[0])
    }
}

chatForm.addEventListener('submit',e=>{
    e.preventDefault();
    var value = document.querySelector('#chatText').value;
    document.querySelector('#chatText').value="";
    socket.emit('chat-recieved',value,Uname);
})
socket.on('chat-recieved',(chat,user)=>{
    var newChat = document.createElement('div');
    var uname = document.createElement('div');
    uname.style.backgroundColor = color[Math.floor(Math.random()*5)]
    var chatContent = document.createElement('p');
    uname.innerHTML=user.charAt(0);
    chatContent.innerHTML = user+":"+chat;
    newChat.appendChild(uname);
    newChat.appendChild(chatContent);
    chatReceived.appendChild(newChat)
})