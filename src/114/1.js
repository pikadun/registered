// ==UserScript==
// @name         114-自动获取可挂号医生
// @description  114挂号脚本
// @version      0.1
// @match        https://www.114yygh.com/hospital/*/source
// @require      https://unpkg.com/axios/dist/axios.min.js
// ==/UserScript==

const params = window.location.pathname.split('/')

const options = {
  target: '2023-06-22',
  hosCode: params[2],
  firstDeptCode: params[3],
  secondDeptCode: params[4],
  include: ['副主任医师']
}

// eslint-disable-next-line no-undef
axios.defaults.headers.common['Request-Source'] = 'PC'

const getDetail = async (options) => {
  const url = 'https://www.114yygh.com/web/product/detail'
  const params = {
    _time: new Date().getTime()
  }
  const requestData = {
    firstDeptCode: options.firstDeptCode,
    secondDeptCode: options.secondDeptCode,
    hosCode: options.hosCode,
    target: options.target
  }

  // eslint-disable-next-line no-undef
  const { data } = await axios.post(url, requestData, { params })
  const result = []
  let count = 0
  data.data.forEach(item => {
    item.detail.forEach(detail => {
      count++
      if (detail.wnumber % 2 === 0) {
        return
      }

      if (!options.include.includes(detail.doctorTitleName)) {
        return
      }

      result.push(detail.uniqProductKey)
    })
  })
  if (count > 0 && result.length === 0) {
    console.log(`${new Date().toLocaleDateString()}当前无号`)
  }
  return result
}

const random = (min, max) => {
  return Math.round(Math.random() * (max - min)) + min
}

const dodo = async () => {
  const result = await getDetail(options)
  if (result.length === 0) {
    const nextTime = random(1000, 3000)
    console.log(`下次执行时间：${nextTime}ms`)
    setTimeout(dodo, nextTime)
    return
  }

  const uniqProductKey = result[0]
  const url = new URL(`https://www.114yygh.com/hospital/${options.hosCode}/submission`)
  url.searchParams.append('hosCode', options.hosCode)
  url.searchParams.append('firstDeptCode', options.firstDeptCode)
  url.searchParams.append('secondDeptCode', options.secondDeptCode)
  url.searchParams.append('dutyTime', '0')
  url.searchParams.append('dutyDate', options.target)
  url.searchParams.append('uniqProductKey', uniqProductKey)
  window.location.href = url.href
}

dodo()
