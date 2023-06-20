const API = require('./api')
const axios = require('axios').default

const oldlog = console.log

console.log = (msg) => {
  oldlog(new Date().toLocaleString(), msg)
}

const isValid = (visit) => {
  const registerFee = parseInt(visit.registerFee)
  return registerFee <= 100 && visit.leftNum > 0
}

const random = (min, max) => {
  return Math.round(Math.random() * (max - min)) + min
}

const notify = async (content) => {
  const url = 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=ca7cca86-5b4e-4fd4-8bf6-850809588fc0'
  const msg = {
    msgtype: 'text',
    text: {
      content
    }
  }
  await axios.post(url, msg)
}

const dodo = async () => {
  await API.login()
  const doctors = await API.getDoctors()
  for (const doctor of doctors) {
    if (doctor.doctorName === '门诊号') {
      continue
    }
    // 休息一下
    await new Promise((resolve) => {
      setTimeout(resolve, random(1000, 3000))
    })
    const schedules = await API.getSchedules(doctor.id)

    for (const schedule of schedules) {
      for (const visit of schedule.visitSchedules) {
        const msg = `${visit.doctorName} ${visit.visitDate} ${visit.amPm === 'a' ? '上午' : '下午'}`
        if (isValid(visit)) {
          await notify(`${msg} 有号`)
          process.exit(0)
        }
        console.log(`${msg} 无号`)
      }
    }
  }
  const nextTime = random(60 * 1000, 3 * 60 * 1000)
  console.log(`下次检查时间：${nextTime / 1000}秒`)
  // 休息一下
  setTimeout(dodo, nextTime)
}

dodo()