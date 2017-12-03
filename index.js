const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const moment = require('moment-timezone')
const crypto = require('crypto')
const services = require('./services')
const worker = require('./worker')
const bot = require('./bot')

const app = express()

app.use(bodyParser.json())
app.use(cors())
app.use((req, res, next) => {
    console.log(new Date(), req.method, req.url)
    next()
})
app.get('/stations', (req, res) => {
    services.getStations().then(stations => {
        res.json(stations)
    })
})

app.get('/times', (req, res) => {
    const departureDateTime = moment.utc(req.query.departureDateTime)
    if(!departureDateTime.isValid()) {
        return res.sendStatus(400)
    }

    services
        .getTimes(req.query.fromStationId, req.query.toStationId, departureDateTime).then(times => {
            res.json(times)
        })
})

app.get('/webhook', (req, res) => {
    return bot._verify(req, res)
})

app.post('/webhook', (req, res) => {
    bot._handleMessage(req.body)
    res.json({status: 'ok'})
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})
