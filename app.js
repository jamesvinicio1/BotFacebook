const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

const APP_TOKEN = 'EAADQZASDVRioBAPNvdYH7Gd2AjIFwSLdZAZBHfRlUA36nvODkr6ZBfWdNQ8dBPUmQxoYvvaKeChehncUGP3YXJy5hjZA8ZCIp2CQZB664tF24Rlpqzph5qZAazB65sSPoQHeKa0xGnGZBVSY7IuCeSFC4jo5kICjOcAKnixwBLgiN3vEaB7CLWQdr'

var app = express()

app.use(bodyParser.json())

var PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
	console.log('Server listen localhost:3000')
})

app.get('/', function (req, res) {
	res.send('Abriendo el puerto desde mi pc Local con http://ngrok.com')
})

app.get('/webhook', function (req, res) {
	if (req.query['hub.verify_token'] === 'carrillomarin') {
		res.send(req.query['hub.challenge'])
	} else {
		res.send('Tu no tienes que entrar aqui')
	}
})

app.post('/webhook', function (req, res) {
	var data = req.body
	if (data.object == 'page') {
		data.entry.forEach(function (pageEntry) {
			pageEntry.messaging.forEach(function (messagingEvent) {
				if (messagingEvent.message) {
					getMessage(messagingEvent, "text")
				}
				if (messagingEvent.postback) {
					getMessage(messagingEvent, "payload")
				}
			})
		})
	}
	res.sendStatus(200)
})

function getMessage(event, origen) {
	var senderID = event.sender.id
	var messageText = "";
	if (origen == "text") {
		messageText = event.message.text
	} else {
		messageText = event.postback.payload
	}


	evaluarMensaje(senderID, messageText)
}
//Ingrese con el Formato Cedula/NombresyApellidos/FechaNacimiento(AAAA-MM-DD)/estatura
function evaluarMensaje(senderID, messageText) {
	var mensaje = '';
	var tamanioCadena = String(messageText).length;
	if (isContain(messageText, 'hola')) {
		mensaje = 'hola que tal? :D , en que puedo ayudarte?, quieres ver nuestro menu de opciones?';
	} else if (isContain(messageText, 'menu') || isContain(messageText, 'otra') || isContain(messageText, 'mas')) {
		enviarMensajeTemplate(senderID);
	} else if (isContain(messageText, 'otras') || isContain(messageText, 'opciones')) {
		enviarMensajeTemplateOtros(senderID);
	} else if (isContain(messageText, 'todos')) {
		getTodosClientes(function (lista) { enviarMensajeTexto(senderID,lista) })
	} else if (isContain(messageText, 'cedula')) {
		mensaje = 'Claro no hay ploblema, dame el numero de cedula';
	} else if (isContain(messageText, 'nuevo')) {
		mensaje = 'Tienes que darme los datos con el Formato: Cedula/NombresyApellidos/FechaNacimiento(AAAA-MM-DD)/estatura';
	} else if (isContain(messageText, 'actualizacion')) {
		mensaje = 'Para actualizar tienes que darme los datos con el Formato Cedula/NombresyApellidos/FechaNacimiento(AAAA-MM-DD)/estatura';
	} else if (isContain(messageText, '/')) {
		var datos = messageText.split("/");
		getCliente(datos[0],function (respuesta) {
			if(typeof respuesta == "string"){
				postCliente(messageText, function(cliente){enviarMensajeTexto(senderID,cliente)})
			}else{
				putCliente(messageText, function(cliente){enviarMensajeTexto(senderID,cliente)})
			}
		});
	} else if (isContain(messageText, 'eliminar')) {
		mensaje = 'Seguro?, Si es asi dame la cedula para eliminarlo, ingresa la cedula seguido del numeral Ej. #1234567890';
	} else if (tamanioCadena === 10) {
		getCliente(messageText, function (cliente) { enviarMensajeTexto(senderID, cliente) })
	} else if (tamanioCadena === 11) {
		deleteCliente(messageText, function (cliente) { enviarMensajeTexto(senderID, cliente) })
	} else if (isContain(messageText, 'gracias')) {
		mensaje = 'con mucho gusto, estoy para servir (Y)';
	} else {
		mensaje = 'Solo se repetir las cosas T_T' + messageText
	}

	enviarMensajeTexto(senderID, mensaje)
}

function enviarMensajeTemplate(senderID) {
	var messageData = {
		recipient: {
			id: senderID
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: 'generic',
					elements: [elementTemplate()]
				}
			}
		}
	}

	callSendAPI(messageData)
}

function elementTemplate() {
	return {
		title: "Cajape S. - Escorza A.",
		subtitle: "Arquitectura de software",
		image_url: "http://www.aprende-facilmente.com/wp-content/uploads/2016/07/nodejs_logo.png",
		buttons: [
			buttonTemplate('Mostrar Todos', 'todos'),
			buttonTemplate('Mostrar x Cedula', 'cedula'),
			buttonTemplate('Otras Opciones', 'otras')
		]
	}
}

function enviarMensajeTemplateOtros(senderID) {
	var messageData = {
		recipient: {
			id: senderID
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: 'generic',
					elements: [elementTemplateOtros()]
				}
			}
		}
	}

	callSendAPI(messageData)
}

function elementTemplateOtros() {
	return {
		title: "Cajape S. - Escorza A.",
		subtitle: "Arquitectura de software",
		image_url: "http://www.aprende-facilmente.com/wp-content/uploads/2016/07/nodejs_logo.png",
		buttons: [
			buttonTemplate('Insertar', 'nuevo'),
			buttonTemplate('Actualizar', 'actualizacion'),
			buttonTemplate('Eliminar', 'eliminar')
		]
	}
}

function buttonTemplate(title, pay) {
	return {
		type: "postback",
		title: title,
		payload: pay

	}


}

//enviar imagen
function enviarMensajeImagen(senderID) {
	var messageData = {
		recipient: {
			id: senderID
		},
		message: {
			attachment: {
				type: "image",
				payload: {
					url: 'https://s-media-cache-ak0.pinimg.com/564x/ef/e8/ee/efe8ee7e20537c7af84eaaf88ccc7302.jpg'
				}

			}
		}
	}

	callSendAPI(messageData)
}
//enviar texto plano
function enviarMensajeTexto(senderID, mensaje) {
	if (typeof mensaje == "string") {
		var messageData = {
			recipient: {
				id: senderID
			},
			message: {
				text: mensaje
			}
		}
	} else {
		var nuevoMensaje = "";
		if (mensaje.identificacion === undefined) {
			nuevoMensaje = "Las personas que encontramos son: \r\n";
			mensaje.forEach(function (item) {
				var arr = item.FEC_NAC.split("T");
				nuevoMensaje += "\nCedula: " + item.CEDULA + "\nNombres: " +
					item.NOMBRE +" "+ item.APELLIDO +  "\nFecha Nacimiento: " + arr[0] +
					 "\nTelefono: " + item.TELEFONO + "\nGenero: " + item.GENERO + "\nEstado: " +
					  item.ESTADO + "\nCorreo: " + item.CORREO + "\nEdad: " + item.EDAD +";\r\n";
			})
		} else {
			var arr = mensaje.fecha_nacimiento.split("T");
			nuevoMensaje = "El cliente que encontramos fue Cedula: " + mensaje.identificacion + ", Nombre: " +
				mensaje.nombres + ", Fecha de Nacimiento: " + arr[0] + " y Estatura: " + mensaje.estatura;
		}
		var messageData = {
			recipient: {
				id: senderID
			},
			message: {
				text: nuevoMensaje
			}
		}
	}


	callSendAPI(messageData)
}

//formatear el texto de regreso al cliente

function getMessageCLima(temperatura) {
	if (temperatura > 30) {
		return "Nos encontramos a " + temperatura + ". Hay demasiado calor, comprate una gaseosa :V"
	} else {
		return "Nos encontramos a " + temperatura + " es un bonito dia para salir"
	}
}

//traer todos los clientes
function getTodosClientes(callback) {
	request('https://secret-reef-38495.herokuapp.com/personas/',
		function (error, response, data) {
			if (!error) {
				callback(JSON.parse(data))
			} else {
				callback("no es posible")
			}
		})
}

//traer los clientes por cedula
function getCliente(cedula, callback) {
	request('https://shrouded-cove-68443.herokuapp.com/clientes/' + cedula,
		function (error, response, data) {
			if (!error) {
				var newData = JSON.parse(data);
				if(newData.identificacion == undefined){
					callback("Lo siento no encontre ese usuario")
				}else{
					callback(newData)
				}
			} else {
				callback("no es posible")
			}
		})
}

//eliminar por cedula
function deleteCliente(cedula, callback) {
	var soloNumeros = cedula.split("#");
	request.delete('https://shrouded-cove-68443.herokuapp.com/clientes/' + soloNumeros[1],
		function (error, response, data) {
			if (!error) {
				callback("Excelente!, el cliente con el numero de cedula " + soloNumeros[1] + " ya fue eliminado")
			} else {
				callback("no es posible")
			}
		})
}

//guardar nuevo cliente
function postCliente(cadenaContenedora, callback) {
	var datos = cadenaContenedora.split("/");
	var options = clienteTemplate(datos[0], datos[1], datos[2]+"T00:00:00.000Z", datos[3]);
	console.log(options)
	request.post(options,
		function (error, response, data) {
			if (!error) {
				callback("Excelente!, el cliente con el numero de cedula " + datos[0] + " ya fue ingresado")
			} else {
				callback("no es posible")
			}
		})
}

//actualizar cliente
function putCliente(cadenaContenedora, callback) {
	var datos = cadenaContenedora.split("/");
	var options = clienteTemplate(datos[0], datos[1], datos[2]+"T00:00:00.000Z", datos[3]);
	request.put(options,
		function (error, response, data) {
			if (!error) {
				callback("Excelente!, el cliente con el numero de cedula " + datos[0] + " ya fue actualizado")
			} else {
				callback("no es posible")
			}
		})
}

//template Model
function clienteTemplate(identificacion, nombres, fecha_nacimiento, estatura) {
	return {
		headers: "content-type: application/json",
		url : 'https://shrouded-cove-68443.herokuapp.com/clientes',
		body : {
			identificacion: identificacion,
			nombres: nombres,
			fecha_nacimiento: fecha_nacimiento,
			estatura: estatura
		},
		json:true
	}
}


function callSendAPI(messageData) {
	//api de facebook
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: { access_token: APP_TOKEN },
		method: 'POST',
		json: messageData
	}, function (error, response, data) {
		if (error)
			console.log('No es posible enviar el mensaje')
		else
			console.log('Mensaje enviado')
	})
}

function isContain(texto, word) {
	if (typeof texto == 'undefined' || texto.length <= 0) return false
	return texto.indexOf(word) > -1
}