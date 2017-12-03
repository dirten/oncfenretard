const kue = require('kue')
const reds = require('reds')

const queue = kue.createQueue({
    disableSearch: false
})

queue.watchStuckJobs()

let search;
function getSearch() {
  if( search ) return search
  reds.createClient = kue.redis.createClient
  return search = reds.createSearch(queue.client.getKey('search'))
}

module.exports = {
    queue,
    getSearch
}
