
require('dotenv').config()
const express = require('express')
var morgan = require('morgan')
const app = express()
app.use(express.json())
app.use(express.static('dist'))
const Person = require('./models/person')


// const requestLogger = (request, response, next) => {
//   console.log('Method:', request.method)
//   console.log('Path:  ', request.path)
//   console.log('Body:  ', request.body)
//   console.log('---')
//   next()
// }

// app.use(requestLogger)

const cors = require('cors')

app.use(cors())


morgan.token('body', (req) => { 
    return JSON.stringify(req.body); 
});
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'));

let persons = [
    { 
      "id": "1",
      "name": "Arto Hellas", 
      "number": "040-123456"
    },
    { 
      "id": "2",
      "name": "Ada Lovelace", 
      "number": "39-44-5323523"
    },
    { 
      "id": "3",
      "name": "Dan Abramov", 
      "number": "12-43-234345"
    },
    { 
      "id": "4",
      "name": "Mary Poppendieck", 
      "number": "39-23-6423122"
    }
]

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

const generateId = () => {
  return String(Math.floor(Math.random() * (99999999999999 - 1 + 1)) + 1)
}

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (request, response, next) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
    .catch(error => next(error))
})

app.get('/info', (request, response) => {
    const now = new Date();
    const formattedDate = now.toString();

    const htmlContent = '<html><body>Phonebook has info for '+persons.length+' people'+
                        '<br><br>'+formattedDate+'</body></html>';

    response.set('Content-Type', 'text/html');
    response.send(htmlContent);
})


app.get('/api/persons/:id', (request, response, next) => {
    // const id = request.params.id
    // const person = persons.find(person => person.id === id)
    // if (person) {
    //     response.json(person)
    // } else {
    //     response.status(404).end()
    // }

    Person.findById(request.params.id).then(person => {
      response.json(person)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    // const id = request.params.id
    // persons = persons.filter(person => person.id !== id)

    // response.status(204).end()
    Person.findByIdAndDelete(request.params.id)
    .then(result => {
        response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
    const body = request.body
    if (!body.name || !body.number) {
        return response.status(400).json({ error: 'The name or number is missing'})
    }

    findPerson = persons.filter((person) => person.name == body.name)
    if(findPerson.length>0){
            return response.status(400).json({
                error: 'name must be unique',
            })
    }

    const person = new Person({
        name: body.name,
        number: body.number,
        id: generateId(),
    })

    //persons = persons.concat(person)
    //response.json(person)
    person.save()
      .then(result => {
          response.json(result)
      })
      .catch(error => {
        console.log(error.response.data.error)
        next(error)      
      })
})

app.put('/api/persons/:id', (request, response, next) => {
 
  const { name, number } = request.body

  Person.findById(request.params.id)
    .then(person => {
      if (!person) {
        return response.status(404).end()
      }

      person.name = name
      person.number = number

      return person.save().then((updatedPerson) => {
        response.json(updatedPerson)
      })
    })
    .catch(error => next(error))
})



app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})