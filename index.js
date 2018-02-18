const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const moment = require('moment-timezone')
const services = require('./services')

const app = express()

app.use(bodyParser.json())
app.use(cors())

app.get('/stations', (req, res) => {
    const stations = services.getStations()
    res.json(stations)
})

app.get('/times', async (req, res) => {
    const departureDateTime = moment.utc(req.query.departureDateTime)
    if(!departureDateTime.isValid()) {
        return res.sendStatus(400)
    }
    try {
        const times = await services.getTimes(
            req.query.fromStationId,
            req.query.toStationId,
            departureDateTime
        )
        res.json(times)
    } catch (err) {
        res.status(500).json(err)
    }
})


app.get('/times/:timeId', async (req, res) => {
    const {timeId} = req.params
    if(!timeId) {
        return res.sendStatus(400)
    }
    try {
        const time = await services.getTime(timeId)
        if(time) {
            res.json(time)
        } else {
            res.sendStatus(404)
        }
    } catch(err) {
        res.status(500).json(err)
    }
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})
