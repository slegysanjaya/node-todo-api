require('./config/config');

const _ = require('lodash');
const {ObjectID} = require('mongodb');
const express = require('express');
const bodyParser = require('body-parser');

var {mongoose} = require('./db/mongoose');
var {User} = require('./models/user');
var {Todo} = require('./models/todo');
var {authenticate} = require('./middleware/authenticate');

var PORT = process.env.PORT || 8000;

var app = express();

app.use(bodyParser.json());

app.listen(PORT, () => {
	console.log(`Started on port ${PORT}`);
});

/* todos */
app.get('/todos', (req, res) => {
	Todo.find().then((todos) => {
		res.send({
			todos,
			code: 0
		});
	}, (err) => {
		res.status(400).send(err);
	});
});

app.post('/todos', (req, res) => {
	var newTodo = new Todo({
		text: req.body.text
	})
	newTodo.save().then((doc) => {
		console.log('Saved todo', doc);
		res.send(doc);
	}, (err) => {
		res.status(400).send('Unable to save todo', err);
	})
});

// Get by id
app.get('/todos/:id', (req, res) => {
	var id = req.params.id;

	// is valid
	if (!ObjectID.isValid(id)) {
		res.status(404).send('ID is not valid', id);
	}

	// findById
	Todo.findById(id).then((todo) => {
		if (!todo) {
			return res.status(404).send('Id not found');
		}
		res.send(todo);
	}).catch((e) => {
		res.status(400).send('Unable to get todo', e);
	});
});

// Remove todo by id
app.delete('/todos/:id', (req, res) => {
	var id = req.params.id;

	// is valid
	if (!ObjectID.isValid(id)) {
		res.status(404).send('ID is not valid', id);
	}

	// findById
	Todo.findByIdAndRemove(id).then((todo) => {
		if (!todo) {
			return res.status(404).send('Id not found');
		}
		res.send(todo);
	}).catch((e) => {
		res.status(400).send('Unable to remove todo', e);
	});
});

// update data
app.patch('/todos/:id', (req, res) => {
	var id = req.params.id;

	/* body request/sending params */
	var body = _.pick(req.body, ['text', 'completed']);

	console.log('Update Todo', body);

	// is valid
	if (!ObjectID.isValid(id)) {
		res.status(404).send('ID is not valid', id);
	}

	if (_.isBoolean(body.completed) && body.completed) {
		body.completedAt = new Date().getTime();
	} else {
		body.completed = false;
		body.completedAt = null;
	}

	Todo.findByIdAndUpdate(id,{
		$set: body
	}, {new: true}).then((todo) => {
		if (!todo) {
			return res.status(404).send();
		}
		res.send({todo: todo});
	}).catch((e) => {
		res.status(400).send();
	})
});

/* users */
app.get('/users', (req, res) => {
	User.find().then((users) => {
		res.send({
			users,
			code: 0
		});
	}, (err) => {
		res.status(400).send(err);
	});
});

/* create new */
app.post('/users', (req, res) => {
	var reqBody = _.pick(req.body, ['email', 'password', 'first_name', 'last_name']);
	var user = new User(reqBody);
	console.log(user)
	user.save().then(() => {
		return user.generateAuthToken();
	}).then((token) => {
		res.header('x-auth', token).send(user);
	}).catch((err) => {
		res.status(400).send(err);
	})
});

app.get('/users/me', authenticate, (req, res) => {
	res.send(req.user);
});


module.exports = {app};