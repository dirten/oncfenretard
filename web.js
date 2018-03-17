const moment = require('moment-timezone')
const services = require('./services')
const backend = require('./backend')
const queue = require('./queue')

backend.app.get('/stations', async (req, res) => {
    const stations = await services.getStations()
    res.json(stations)
})

backend.app.get('/times', async (req, res) => {
    const departureDateTime = moment.utc(req.query.departureDateTime, 'X')
    if(!departureDateTime.isValid() ||
       !req.query.fromStationId ||
       !req.query.toStationId) {
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
        res.status(500)
    }
})


backend.app.get('/times/:timeId', async (req, res) => {
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

backend.io.on('connection', async (socket) => {
    socket.on('subscribe', async (timeId) => {
        const job =  queue.create('watch', {timeId}).attempts(10)
        job.save(async (err) => {
            if(err) {
                return console.log('job creation error', err)
            }
            console.log('queued job', timeId, job.id)

            socket.join(timeId, async (err) => {
                if(err) {
                    return console.log('subscription error', err)
                }
                console.log('subscribed', timeId)
            })
        })
    })
})

const port = process.env.PORT || 3000
backend.server.listen(port, () => {
    console.log(`backend.app listening on port ${port}`)
})
