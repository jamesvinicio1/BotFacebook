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

function evaluarMensaje(senderID, messageText) {
	var mensaje = '';
	var tamanioCadena = String(messageText).length;
	if (isContain(messageText, 'hola')) {
		mensaje = 'Estimado usuario, ¿Deseas desplegar el menu de servicios?';
	} else if (isContain(messageText, 'claro') || isContain(messageText, 'bueno') || isContain(messageText, 'ok') || isContain(messageText, 'menu') || isContain(messageText, 'si') || isContain(messageText, 'mas')) {
		enviarMensajeTemplate(senderID);
	} else if (isContain(messageText, 'varios') || isContain(messageText, 'submenu') || isContain(messageText, 'otras') || isContain(messageText, 'opciones')) {
		enviarMensajeTemplateOtros(senderID);
	} else if (isContain(messageText, 'todos') || isContain(messageText, 'todas las personas')) {
		getTodosClientes(function (lista) { enviarMensajeTexto(senderID,lista) })
	} else if (isContain(messageText, 'busqueda por cedula') || isContain(messageText, 'cedula') || isContain(messageText, 'por cedula')) {
		mensaje = 'Estimado usuario, por favor ingresa el numero de cedula de la persona que quieres buscar: ';
	} else if (isContain(messageText, 'nuevo') || isContain(messageText, 'nueva persona') || isContain(messageText, 'crear persona') ) {
		mensaje = 'Estimado usuario, por favor ingresa a una persona con el siguiente formato: Cedula/Nombre/Apellido/Fecha de nacimiento/Telefono/Genero,/Estado/Correo/Edad';
	} else if (isContain(messageText, 'actualizacion') || isContain(messageText, 'actualizar persona')) {
		mensaje = 'Estimado usuario, para modificar por favor ingresa a la persona y el cambio con el siguiente formato: Cedula/Nombre/Apellido/Fecha de nacimiento/Telefono/Genero,/Estado/Correo/Edad';
	} else if (isContain(messageText, '/')) {
		var datos = messageText.split("/");
		getCliente(datos[0],function (respuesta) {
			if(typeof respuesta == "string"){
				postCliente(messageText, function(cliente){enviarMensajeTexto(senderID,cliente)})
			}else{
				putCliente(messageText, function(cliente){enviarMensajeTexto(senderID,cliente)})
			}
		});
	} else if (isContain(messageText, 'eliminar')||isContain(messageText, 'borrar')||isContain(messageText, 'eliminar persona')) {
		mensaje = 'Estimado usuario, para eliminar una persona debes ingresar la palabra borra y el numero de cedula, asi: borra 1721670444';
	} else if (tamanioCadena === 10) {
		getCliente(messageText, function (cliente) { enviarMensajeTexto(senderID, cliente) })
	} else if (tamanioCadena === 16) {
		deleteCliente(messageText, function (cliente) { enviarMensajeTexto(senderID, cliente) })
	} else if (isContain(messageText, 'gracias')||isContain(messageText, 'fin')||isContain(messageText, 'chao')||isContain(messageText, 'salir')) {
		mensaje = 'Estimado usuario, gracias por utilizar nuestro CRUD, vuelve ponto.';
	} else {
		mensaje = 'Estimado usuario, no entiendo esa palabra, puedes intentar con la palabra menu'
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
		title: "CHAT BOT - FACEBOOK",
		subtitle: "CARRILLO - MARIN",
		image_url: "https://postcron.com/es/blog/wp-content/uploads/2017/12/facebook_bot.jpg",
		buttons: [
			buttonTemplate('Desplegar todas las personas', 'todos'),
			buttonTemplate('Desplegar persona por cedula', 'cedula'),
			buttonTemplate('Desplegar mas Opciones', 'otras')
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
		title: "CHAT BOT - FACEBOOK",
		subtitle: "CARRILLO - MARIN",
		image_url: "https://postcron.com/es/blog/wp-content/uploads/2017/12/facebook_bot.jpg",
		buttons: [
			buttonTemplate('Agregar una persona nueva', 'nuevo'),
			buttonTemplate('Modificar una persona existente', 'actualizacion'),
			buttonTemplate('Eliminar una persona', 'eliminar')
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
			nuevoMensaje = "Las personas que encontramos en nuestra DB son las siguientes: \r\n";
			mensaje.forEach(function (item) {

				nuevoMensaje += "\nCedula: " + item.CEDULA + "\nNombres: " +
					item.NOMBRE + "\nApellido: " + item.APELLIDO + "\nFecha Nacimiento: " + item.FEC_NAC +
					"\nTelefono: " + item.TELEFONO + "\nGenero: " + item.GENERO + "\nEstado: " +
					item.ESTADO + "\nCorreo: " + item.CORREO + "\nEdad: " + item.EDAD + ";\r\n\n";
			})
		} else {
			nuevoMensaje += "\nCedula: " + mensaje.CEDULA + "\nNombres: " +
					mensaje.NOMBRE + "\nApellido: " + mensaje.APELLIDO + "\nFecha Nacimiento: " + mensaje.FEC_NAC +
					"\nTelefono: " + mensaje.TELEFONO + "\nGenero: " + mensaje.GENERO + "\nEstado: " +
					mensaje.ESTADO + "\nCorreo: " + mensaje.CORREO + "\nEdad: " + mensaje.EDAD + ";\r\n\n";
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

//traer todos los clientes
function getTodosClientes(callback) {
	request('https://secret-reef-38495.herokuapp.com/personas/',
		function (error, response, data) {
			if (!error) {
				callback(JSON.parse(data))
			} else {
				callback("Estimado usuario, no se establece una conexion con el servidor")
			}
		})
}

//traer los clientes por cedula
function getCliente(CEDULA, callback) {
	request('https://secret-reef-38495.herokuapp.com/personas/cedula'+CEDULA,
		function (error, response, data) {
			if (!error) {
				var newData = JSON.parse(data);
				if(newData.CEDULA == undefined){
					callback("Estimado usuario, no se encontro una persona con ese numero de cedula")
				}else{
					callback(newData)
				}
			} else {
				callback("Estimado usuario, no se establece una conexion con el servidor")
			}
		})
}

//eliminar por cedula
function deleteCliente(cedula, callback) {
	var soloNumeros = cedula.split("borra ");
	request.delete('https://secret-reef-38495.herokuapp.com/personas/' + soloNumeros[1],
		function (error, response, data) {
			if (!error) {
				callback("Estimado usuario, la persona con la cedula " + soloNumeros[1] + " se borro de la DB")
			} else {
				callback("Estimado usuario, no se establece una conexion con el servidor")
			}
		})
}

//guardar nuevo cliente
function postCliente(cadenaContenedora, callback) {
	var datos = cadenaContenedora.split("/");
	var options = clienteTemplate(datos[0], datos[1], datos[2], datos[3], datos[4], datos[5], datos[6], datos[7], datos[8]);
	console.log(options)
	request.put(options,
		function (error, response, data) {
			if (!error) {
				callback("Estimado usuario, la persona con la cedula " + datos[0] + " se añadio a la DB")
			} else {
				callback("Estimado usuario, no se establece una conexion con el servidor")
			}
		})
}

//actualizar cliente
function putCliente(cadenaContenedora, callback) {
	var datos = cadenaContenedora.split("/");
	var options = clienteTemplate(datos[0], datos[1], datos[2], datos[3], datos[4], datos[5], datos[6], datos[7], datos[8]);
	request.post(options,
		function (error, response, data) {
			if (!error) {
				callback("Estimado usuario, la persona con la cedula " + datos[0] + " a sido actualizada en nuestra DB")
			} else {
				callback("Estimado usuario, no se establece una conexion con el servidor")
			}
		})
}

//template Model
function clienteTemplate(CEDULA, NOMBRE, APELLIDO, FEC_NAC,TELEFONO,GENERO,ESTADO,CORREO,EDAD) {
	return {
		headers: "content-type: application/json",
		url : 'https://secret-reef-38495.herokuapp.com/personas/',
		body : {
			CEDULA:CEDULA,
			NOMBRE:NOMBRE,
			APELLIDO:APELLIDO,
			FEC_NAC:FEC_NAC,
			TELEFONO:TELEFONO,
			GENERO:GENERO,
			ESTADO:ESTADO,
			CORREO:CORREO,
			EDAD:EDAD
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
			console.log('Estimado usuario, NO es posible enviar el mensaje')
		else
			console.log('Estimado usuario, el mensaje fue enviado')
	})
}

function isContain(texto, word) {
	if (typeof texto == 'undefined' || texto.length <= 0) return false
	return texto.indexOf(word) > -1
}