var connection = new WebSocket('wss://rtc.tiansc.top/rtc'),
  name = ''
var loginPage = document.querySelector('#login-page'),
  usernameInput = document.querySelector('#username'),
  loginButton = document.querySelector('#login'),
  callPage = document.querySelector('#call-page'),
  theirUsernameInput = document.querySelector('#their-username'),
  callButton = document.querySelector('#call'),
  hangUpButton = document.querySelector('#hang-up');
callPage.style.display = "none";

// Login when the user clicks the button
loginButton.addEventListener("click",
  function(event) {
    name = searchObj.name || usernameInput.value;
    // debugger
    if (name.length > 0) {
      send({
        type: "login",
        name: name
      });
    }
  });
// 获取参数
let search = location.search
search = search.slice(1)
const searchArr = search ? search.split('&') : []
const searchObj = {}
for (let a  = 0; a < searchArr.length; a++) {
  const itemArr = searchArr[a].split('=')
  searchObj[itemArr[0]] = itemArr[1]
}
console.log(searchObj)
connection.onopen = function() {
  console.log("Connected");
  loginButton.click()
};
// Handle all messages through this callback
connection.onmessage = function(message) {
//alert(JSON.stringify(message.data));
  console.log("Got message", message.data);
  var data = JSON.parse(message.data);
  switch (data.type) {
    case "login":
      onLogin(data.success);
      break;
    case "offer":
      onOffer(data.offer, data.name);
      break;
    case "answer":
      onAnswer(data.answer);
      break;
    case "candidate":
      onCandidate(data.candidate);
      break;
    case "leave":
      onLeave();
      break;
    default:
      break;
  }
};
connection.onerror = function(err) {
  console.log("Got error", err);
};
// Alias for sending messages in JSON format
function send(message) {
  if (connectedUser) {
    message.name = connectedUser;
  }
  connection.send(JSON.stringify(message));
};
function onLogin(success) {
  if (success === false) {
    alert("Login unsuccessful, please try a different name.");
  } else {
    loginPage.style.display = "none";
    callPage.style.display = "block";
// Get the plumbing ready for a call
    startConnection();
  }
};
callButton.addEventListener("click",
  function() {
    var theirUsername = theirUsernameInput.value;
    if (theirUsername.length > 0) {
      startPeerConnection(theirUsername);
    }
  });
hangUpButton.addEventListener("click",
  function() {
    send({
      type: "leave"
    });
    onLeave();
  });
function onOffer(offer, name) {
  connectedUser = name;
  yourConnection.setRemoteDescription(new RTCSessionDescription(offer));
  yourConnection.createAnswer(function(answer) {
      yourConnection.setLocalDescription(answer);
      send({
        type: "answer",
        answer: answer
      });
    },
    function(error) {
      alert("An error has occurred");
    });
}
function onAnswer(answer) {
  yourConnection.setRemoteDescription(new RTCSessionDescription(answer));
}
function onCandidate(candidate) {
  yourConnection.addIceCandidate(new RTCIceCandidate(candidate));
}
function onLeave() {
  connectedUser = null;
  theirVideo.src = null;
  yourConnection.close();
  yourConnection.onicecandidate = null;
  yourConnection.onaddstream = null;
  setupPeerConnection(stream);
}
function hasUserMedia() {
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  return !! navigator.getUserMedia;
}
function hasRTCPeerConnection() {
  window.RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  window.RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription;
  window.RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
  return !! window.RTCPeerConnection;
}
var yourVideo = document.querySelector('#yours'),
  theirVideo = document.querySelector('#theirs'),
  yourConnection,
  connectedUser,
  stream;
function startConnection() {
  if (hasUserMedia()) {
    navigator.getUserMedia({
        video: true,
        audio: true
      },
      function(myStream) {
        stream = myStream;
        // yourVideo.src = window.URL.createObjectURL(stream);
        try {
          yourVideo.srcObject = stream;
        } catch (error) {
          yourVideo.src = window.URL.createObjectURL(stream);
        }
        if (hasRTCPeerConnection()) {
          setupPeerConnection(stream);
        } else {
          alert("Sorry, your browser does not support WebRTC.");
        }
      },
      function(error) {
        console.log(error);
      });
  } else {
    alert("Sorry, your browser does not support WebRTC.");
  }
}
function setupPeerConnection(stream) {

  var configuration = {
    "iceServers": [{
      "url": "stun:stun.1.google.com:19302"
    }]
  };
  yourConnection = new RTCPeerConnection(configuration);
// Setup stream listening
  yourConnection.addStream(stream);
  yourConnection.onaddstream = function(e) {
    // theirVideo.src = window.URL.createObjectURL(e.stream);
    try {
      theirVideo.srcObject = e.stream;
    } catch (error) {
      theirVideo.src = window.URL.createObjectURL(e.stream);
    }
  };
// Setup ice handling
  yourConnection.onicecandidate = function(event) {
    if (event.candidate) {
      send({
        type: "candidate",
        candidate: event.candidate
      });
    }
  }
}
function startPeerConnection(user) {
  connectedUser = user;
// Begin the offer
  yourConnection.createOffer(function(offer) {
      send({
        type: "offer",
        offer: offer
      });
      yourConnection.setLocalDescription(offer);
    },
    function(error) {
      alert("An error has occurred.");
    });
};
