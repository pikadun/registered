const Axios = require('axios').default
const crypto = require('crypto-js')
const cache = require('./cache')

const axios = Axios.create({
  baseURL: 'https://pat2.puh3.net.cn',
  timeout: 3000
})

axios.interceptors.request.use(async config => {
  if (config.url !== '/api/v2/patient/login' && !isTokenExpired()) {
    await login()
  }
  config.headers = Object.assign({}, config.headers, getHeaders())
  return config
})

axios.interceptors.response.use(response => response, error => {
  console.error(error.message)
})

const decode = (data, ivData, keyData) => {
  const key = crypto.enc.Utf8.parse(keyData)
  const iv = crypto.enc.Utf8.parse(ivData.substring(ivData.length - 16, ivData.length))
  const s = crypto.enc.Hex.parse(data)
  const o = crypto.enc.Base64.stringify(s)
  const u = crypto.AES.decrypt(o, key, {
    iv,
    mode: crypto.mode.CBC,
    padding: crypto.pad.Pkcs7
  }).toString(crypto.enc.Utf8)
  return JSON.parse(u.toString())
}

const isTokenExpired = () => {
  const token = cache.get(cache.KEYS.token)
  try {
    const parts = token.split('.')
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    const exp = payload.exp
    const now = Math.floor(Date.now() / 1000)
    return now > (exp - 60)
  } catch (e) {
    return true
  }
}

const getHeaders = () => {
  return {
    system: '16.3.1',
    version: '2.0.20',
    userid: cache.get(cache.KEYS.userid),
    timestamp: Date.now(),
    platform: 'Ios',
    token: cache.get(cache.KEYS.token),
    'User-Agent': 'hospitalpatientapp/230519 CFNetwork/1404.0.5 Darwin/22.3.0',
    model: 'iPhone14,7'
  }
}

const departmentId = '6447456cd031fe7273d98184'

const login = async () => {
  if (!isTokenExpired()) {
    return
  }
  console.log('token 过期，重新登录')
  cache.clear()
  const aesKey = 'BEIYISAN'
  const username = crypto.AES.encrypt('18840822261', aesKey).toString()
  const password = crypto.AES.encrypt('1234qwer', aesKey).toString()
  const url = '/api/v2/patient/login'
  const params = { username, password }
  const { data } = await axios.post(url, params)
  if (data.code !== '200') {
    throw new Error(JSON.stringify(data))
  }
  console.log('登录成功')
  cache.set(cache.KEYS.userid, data.data.userId)
  cache.set(cache.KEYS.token, data.data.token)
  cache.set(cache.KEYS.usersig, data.data.usersig)
}

const doctors = {
  data: null,
  expire: Date.now()
}

const getDoctors = async () => {
  if (doctors.data && doctors.expire > Date.now()) {
    return doctors.data
  }

  const url = '/api/v1/appointment/getDepartmentDoctors'
  const postData = {
    departmentAppointmentId: departmentId,
    getSchedule: true,
    isToday: false,
    departmentType: 'gh',
    userId: cache.get(cache.KEYS.userid),
    mTicket: '',
    mRandstr: ''
  }
  const result = await axios.post(url, postData)
  console.log('获取医生列表')
  if (!result) {
    return []
  }

  const data = decode(result.data, cache.get(cache.KEYS.token), postData.userId)
  if (data.code !== '200') {
    throw new Error(JSON.stringify(data))
  }
  doctors.data = data.data
  doctors.expire = Date.now() + 1000 * 60 * 30
  return data.data
}

const getSchedules = async (doctorId) => {
  const url = '/api/v1/appointment/area/getVisitSchedules'
  const postData = {
    departmentId,
    doctorId,
    userId: cache.get(cache.KEYS.userid),
    hospitalName: '北京大学第三医院',
    group_name: ''
  }
  const result = await axios.post(url, postData)
  if (!result) {
    return []
  }

  const data = decode(result.data, cache.get(cache.KEYS.token), postData.userId)
  if (data.code !== '200') {
    throw new Error(JSON.stringify(data))
  }
  return data.data
}

module.exports = {
  login,
  getDoctors,
  getSchedules
}
