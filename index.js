const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const moment = require('moment-timezone')
const NodeCache = require( "node-cache" )
const services = require('./services')

const app = express()
const cache = new NodeCache({
    stdTTL: 24 * 60 * 60 // 24 hours time-to-live
})

app.use(bodyParser.json())
app.use(cors())

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
    const departureDateTime = moment.utc(req.query.departureDateTime)
    if(!departureDateTime.isValid()) {
        return res.sendStatus(400)
    }
    services
        .getTimes(req.query.fromStationId, req.query.toStationId, departureDateTime)
        .then(times => res.json(times))
        .catch(err => res.sendStatus(500))
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})
