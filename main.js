var r = require('rethinkdb');
var path = require('path');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8080);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.get('/appointments*', function (req, res) {
  res.sendFile(__dirname + '/appointments.html');
});
console.log("App listening on port 8080");

 
var dbConfig = {
    host: 'rethinkdb.southcentralus.cloudapp.azure.com',
    port: 28015,
    db: 'test'
};

var getDoctors = r.table("doctors");
 
function changesinappointment(msg) {

		r.connect({host: dbConfig.host, port: dbConfig.port}).then(function(conn) {
	  	console.log('GETTING APPOINTMENTS3333')
	    return r.table('appointments').filter({doctor:msg}).changes().run(conn)
	      .finally(function() { });
	  })
	  .then(function(output) { 
	  	output.each(function(err, data) {
	  		console.log('SENDING UPDATE')
		    io.sockets.emit("update", data);
		  });

		});


  	}

// changesinappointment('4758038d-fc7f-4c7c-81ef-bce8cda709f0');

 
io.on("connection", function(socket) {
	console.log("You connected!");
  
  	// console.log(JSON.stringify(output))
  	// socket.emit("doctors", output); });

  	socket.on('getdoctors', function(){
  		r.connect({host: dbConfig.host, port: dbConfig.port}).then(function(conn) {
	  	console.log('GETTING DOCTORS')
	    return getDoctors.run(conn)
	      .finally(function() { conn.close(); });
	  })
	  .then(function(output) { 
	  	output.toArray(function(err, result) {
	        if (err) throw err;
	        // console.log(JSON.stringify(result, null, 2));
	        socket.emit("doctors", result); });
	    });
  	});

  	
	

  	socket.on('getappointments', function(msg){
    	console.log('GETTING APPOINTMENT INFO:' + msg);
    	changesinappointment(msg);
    	r.connect({host: dbConfig.host, port: dbConfig.port}).then(function(conn) {
	  	console.log('GETTING APPOINTMENTS')
	    return r.table('appointments').filter({doctor:msg}).eqJoin('doctor',r.table('doctors')).zip().run(conn)
	      .finally(function() { conn.close(); });
	  })
	  .then(function(output) { 
	  	output.toArray(function(err, result) {
	        if (err) throw err;
	        // console.log(JSON.stringify(result, null, 2));
	        socket.emit("appointments", result); });
	    });


  	});
});

