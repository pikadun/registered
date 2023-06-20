// ==UserScript==
// @name         114-自动提交挂号
// @description  114挂号脚本
// @version      0.1
// @match        https://www.114yygh.com/hospital/*/submission*
// @require      https://unpkg.com/axios/dist/axios.min.js
// ==/UserScript==

const url = new URL(window.location.href)

const options = {
  hosCode: url.searchParams.get('hosCode'),
  uniqProductKey: url.searchParams.get('uniqProductKey')
}

// eslint-disable-next-line no-undef
axios.defaults.headers.common['Request-Source'] = 'PC'

const getSMSCode = async (uniqProductKey) => {
  const url = 'https://www.114yygh.com/web/common/verify-code/get'
  const params = {
    _time: new Date().getTime(),
    mobile: 'VWvgWJDN1I-Ifnaq0xmzEQ==',
    // mobile: 'QcfRWvMBUS9npugAA0GKlQ==',
    smsKey: 'ORDER_CODE',
    uniqProductKey,
    code: ''
  }
  // eslint-disable-next-line no-undef
  await axios.get(url, { params })
}

const dodo = async () => {
  getSMSCode(options.uniqProductKey)
}
dodo()
