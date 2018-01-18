const puppeteer = require('puppeteer')
const devices = require('puppeteer/DeviceDescriptors')
const iPhone = devices['iPhone 6']
const fs = require('fs')
const path = require('path')

async function grabPage (id, browser) {
  const page = await browser.newPage()
  await page.emulate(iPhone)
  try {
    await page.goto(`https://www.aliexpress.com/store/contactinfo/${id}.html`)
    const data = await getData(page)
    data.id = id
    return data
  } catch (e) {
    const resp = await page.content()
    throw new Error('page failed:' + resp)
  } finally {
    await page.close()
  }
}

async function getData (page) {
  const obj = {}
  for (let key in config) {
    const element = await page.$(config[key])
    const text = await page.evaluate(e => e.textContent, element)
    obj[key] = text
  }
  return obj
}
const config = {
  'contactName': '#node-contacts .contactName',
  'streetAddress': '#node-contacts > div > div > div.bd > table > tbody > tr:nth-child(3) > td',
  'city': '#node-contacts > div > div > div.bd > table > tbody > tr:nth-child(4) > td',
  'province': '#node-contacts > div > div > div.bd > table > tbody > tr:nth-child(5) > td',
  'country': '#node-contacts > div > div > div.bd > table > tbody > tr:nth-child(6) > td'
}

async function init () {
  var out = fs.createWriteStream(path.resolve(__dirname, 'data.log'), {
    encoding: 'utf8'
  })

  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})// 禁用沙盒
  let start = 700000
  for (let i = 0; i < 10; i++) {
    doNext()
  }

  function doNext () {
    if (start > 800000) return
    grabPage(++start, browser).then(data => {
      out.write(JSON.stringify(data, null, 4))
      console.log('load page：' + start + ' success')
      doNext()
    }, e => {
      console.log('load page：' + start + ' fail')
      console.warn(e)
      doNext()
    })
  }
//   out.end()
//   await browser.close()
}

init()
