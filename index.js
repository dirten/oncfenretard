const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const moment = require('moment-timezone')
const crypto = require('crypto')
const services = require('./services')
const kue = require('kue')
const mykue = require('./mykue')
const worker = require('./worker')

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

app.get('/subscribe', (req, res) => {
    const {fromStationId, toStationId, userId, timeId} = req.query

    const jobKey = crypto.createHash('sha1').update(`${fromStationId}-${toStationId}-${userId}-${timeId}`).digest('hex')

    mykue.getSearch().query(jobKey).end((err, ids) => {
        if(err) {
            return res.sendStatus(500)
        }
        if(ids.length > 0) {
            kue.Job.get(ids[0], (err, job) => {
                return res.json(job)
            })
        } else {
            const job = mykue.queue.create('watch', {
                userId,
                fromStationId,
                toStationId,
                timeId,
                jobKey
            })
            job.attempts(3)
            job.searchKeys(['jobKey'])
            job.removeOnComplete(true)
            job.save(err => {
                if(err) {
                    return res.sendStatus(500)
                }
                return res.json(job)
            })
        }
    })
})

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})
