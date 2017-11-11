const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const moment = require('moment-timezone')
const NodeCache = require('node-cache')
const services = require('./services')

const app = express()
const cache = new NodeCache({
    stdTTL: 24 * 60 * 60 // 24 hours time-to-live
})

app.use(bodyParser.json())
app.use(cors())
app.use((req, res, next) => {
    console.log(new Date(), req.method, req.url) 
    next()
})
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
    const cacheKey = `times-${req.query.fromStationId}-${req.query.fromStationId, req.query.toStationId}-${departureDateTime.format('x')}`
    const times = cache.get(cacheKey)
    if (times !== undefined) {
        return res.json(times)
    }

    services
        .getTimes(req.query.fromStationId, req.query.toStationId, departureDateTime).then(times => {
            cache.set(cacheKey, times, 60)
            res.json(times)
        })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})
