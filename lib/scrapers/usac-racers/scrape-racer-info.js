import { log } from 'console-tools'
import cheerio from 'cheerio' // jQuery-like HTML manipulation

const scrapeRacerInfo = ({response, urlWithContext}) => {
  let $ = cheerio.load(response.body)
  const error = $('.errormessage').text().trim()

  if (error) {
    if (error.toLowerCase() === 'No member found matching the license number .'.toLowerCase()) {
      log.doneBut('#' + urlWithContext.context.licenceNo + ' ' + error)
      return []
    } else {
      log.fail(error)
      log.json(urlWithContext)
    }
  }

  const noResultsMsg = $('#resultsmain').text().trim()

  if (noResultsMsg && noResultsMsg.toLowerCase() === 'No rider results found.'.toLowerCase()) {
    log.doneBut('#' + urlWithContext.context.licenceNo + ' ' + noResultsMsg)
    return []
  }

  const $mainTable = $('#resultsmain table')
  let nameLbl = $mainTable.find('td b').eq(0).text()
  let ageAndFromLbl = $mainTable.find('td b').eq(1).text()
  let raceCount = $mainTable.find('tr.homearticlebody').toArray().length

  let name

  if (nameLbl) {
    name = nameLbl.match(/Race Results for(.+)/)[1].trim()
  }

  let age
  let address

  if (ageAndFromLbl) {
    let ageMatches = ageAndFromLbl.match(/Racing Age (\d\d?\d?) .*/)

    if (ageMatches && ageMatches.length > 0) {
      age = ageMatches[1]
    }

    let addressMatches = ageAndFromLbl.match(/from (.*)/)

    if (addressMatches && addressMatches.length > 0) {
      address = addressMatches[1].trim()
    }
  }

  if (!name && !age && !address && !raceCount) {
    log.fail('#' + urlWithContext.context.licenceNo + ' ' + 'All fields are empty, something is wrong.')
    return []
  }

  const racerInfo = {
    licenceNo: urlWithContext.context.licenceNo,
    name: name,
    age: age,
    raceCount: raceCount,
    address: address,
    _urlUsedToPullInfo: urlWithContext.url,
  }
  // log.json(racerInfo)
  log.done(`#${urlWithContext.context.licenceNo} - ${name}, ${age}, ${address}, races: ${raceCount}`)

  return [racerInfo]
}

export default scrapeRacerInfo
