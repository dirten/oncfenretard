const axios = require('axios')
const moment = require('moment')
const crypto = require('crypto')
const url = require('url')

const client = axios.create({
    baseURL: 'http://41.137.246.220/api'
})

client.interceptors.request.use(
    (config) => {
        const parsedUrl = url.parse(config.url)
        config.params = {
            ...config.params,
            hash: crypto.createHash('sha512').update(parsedUrl.pathname.replace('/', '') + '011CFes***@hchmd').digest('hex')
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

module.exports = {
    getStations() {
        return client
            .get('/gares')
            .then(response => response.data.map(station => ({
                id: station.CodeGare,
                name: {
                    french: station.NomGareFr,
                    arabic: station.NomGareAr
                }
            })))
    },
    getTimes(fromStationId, toStationId, departureDateTime = moment()) {
        return client
            .get('/trainnow/search', {
                params: {
                    gareDepart: fromStationId,
                    gareArrive: toStationId,
                    date: departureDateTime.toISOString()
                }
            })
            .then(response => response.data.map(time => {
                const baseTime = moment(time.DateDepart)

                let plannedDepartureTime = actualDepartureTime =  moment(time.HeureDepart, 'HH:mm')
                let plannedArrivalTime = actualArrivalTime =  moment(time.HeureArrive, 'HH:mm')
                
                if(time.RetardReal > 0) {
                    actualDepartureTime = moment(actualDepartureTime).add(time.RetardReal, 'seconds')
                    actualArrivalTime = moment(actualArrivalTime).add(time.RetardReal, 'seconds')
                }

                // train in deparature station
                const trains = [{
                    station: {
                        id: fromStationId
                    },
                    type: time.Train.Gamme
                }]

                if(time.Correspondnaces) {
                    time.Correspondnaces.forEach(correspondnace => {
                        trains.push({
                            station: {
                                id: `${correspondnace.CodeGare}0000` // don't ask me why!
                            },
                            type: correspondnace.GammeTrain
                        })
                    })
                }

                // trip info
                const tripDuration = actualArrivalTime.diff(actualDepartureTime, 'minutes')

                return {
                    isDelayed: time.RetardMinutes > 0,
                    trip: {
                        distance: time.DistanceGD_DA,
                        duration: {
                            hours: Math.floor(tripDuration / 60),
                            minutes: tripDuration % 60
                        } 
                    },
                    delay: {
                        hours: time.RetardMinutes > 0 ? Math.floor(time.RetardMinutes / 60) : 0, 
                        minutes: time.RetardMinutes > 0 ? time.RetardMinutes % 60 : 0
                    },
                    plannedDepartureDateTime: moment(baseTime).set({hour: plannedDepartureTime.get('hour'), minute: plannedDepartureTime.get('minute')}),
                    plannedArrivalDateTime: moment(baseTime).set({hour: plannedArrivalTime.get('hour'), minute: plannedArrivalTime.get('minute')}),
                    actualDepartureDateTime: moment(baseTime).set({hour: actualDepartureTime.get('hour'), minute: actualDepartureTime.get('minute')}),
                    actualArrivalDateTime: moment(baseTime).set({hour: actualArrivalTime.get('hour'), minute: actualArrivalTime.get('minute')}),
                    trains: trains
                }  
            }))
    }
}
// module.exports.getStations().then(console.log)
// module.exports.getTimes('2290000', '2510000', moment('2017-10-14T13:56:08.470Z')).then(console.log).catch(console.log)
