const fs = require('fs')
const path = require('path')

class Cache {
  KEYS = {
    userid: 'userid',
    token: 'token',
    usersig: 'usersig'
  }

  #filePath = path.resolve(__dirname, './cache.json')
  #cache

  constructor () {
    fs.existsSync(this.#filePath) || fs.writeFileSync(this.#filePath, '{}')
    const cache = fs.readFileSync(this.#filePath, 'utf-8')
    this.#cache = JSON.parse(cache)
  }

  get (key) {
    const data = this.#cache[key]
    return data && JSON.parse(data)
  }

  set (key, value) {
    this.#cache[key] = JSON.stringify(value)
    fs.writeFileSync(this.#filePath, JSON.stringify(this.#cache))
  }
}

module.exports = new Cache()
