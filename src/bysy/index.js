const API = require('./api')
const axios = require('axios').default
const exec = require('child_process').exec

const oldlog = console.log
console.log = (msg) => {
  if (typeof msg !== 'string') {
    msg = JSON.stringify(msg)
  }

  oldlog(new Date().toLocaleString(), msg)
}

const stop = () => {
  console.log('pm2 stop 0')
  exec('pm2 stop 0')
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
  console.log('---------- 开始检查 ----------')
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
          stop()
        }
        console.log(`${msg} 无号`)
      }
    }
  }
  const nextTime = random(1 * 60 * 1000, 2 * 60 * 1000)
  console.log(`下次检查时间：${nextTime / 1000}秒`)
  console.log('---------- 检查结束 ----------')
  // 休息一下
  setTimeout(dodo, nextTime)
}

dodo()

process.on('uncaughtException', async (err) => {
  console.error(err)
  await notify(err.message)
  stop()
})

process.on('unhandledRejection', async (err) => {
  console.error(err)
  await notify(err.message)
  stop()
})
