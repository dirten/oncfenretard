const express = require('express')
const bodyParser = require('body-parser')
const moment = require('moment')
const NodeCache = require( "node-cache" )
const services = require('./services')

const app = express()
const cache = new NodeCache({
    stdTTL: 24 * 60 * 60 // 24 hours time-to-live
})

app.use(bodyParser.json())

app.get('/stations', (req, res) => {
    const stations = cache.get('stations')
    if (stations !== undefined) {
        return res.json(stations)
    }
    
    services.getStations().then(stations => {
        cache.set('stations', stations)
        res.json(stations)
    })
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
