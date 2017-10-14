const express = require('express')
const bodyParser = require('body-parser')
const moment = require('moment')
const services = require('./services')

const app = express()

app.use(bodyParser.json())

app.get('/stations', (req, res) => {
    services.getStations().then(stations => res.json(stations))
})

app.get('/times', (req, res) => {
    const departureDateTime = moment(req.query.departureDateTime)
    if(!departureDateTime.isValid()) {
        return res.sendStatus(400)
    }
    services
        .getTimes(req.query.fromStationId, req.query.toStationId, departureDateTime)
        .then(times => res.json(times))
})

app.listen(3000, () => {
    console.log('Example app listening on port 3000!')
})
