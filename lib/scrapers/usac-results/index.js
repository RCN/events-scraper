/** list of results by state https://www.usacycling.org/results/browse.php?state=CN&race=&fyear=2017
  Few approaches:
    - scrape links to results from those pages by year by sate
      - then download results
    - or try iterating ids
    - or (preferrred approach)
      - scrape events
      - have a list of permits
      - doenload results using the list of valid permit ids
If any cookie is present then the following direct link can be used:
  vanilla CSV:
    https://www.usacycling.org/results/index.php?year=2011&id=3524&ajax=1&act=csv
  formatted CSV:
    https://www.usacycling.org/results/index.php?year=2011&id=3524&ajax=1&act=resultscsv

  Note that id is permit number, the second part .e.g permit 2013-3042 (giro di sf) is this URL:
    https://www.usacycling.org/results/index.php?year=2013&id=3042&ajax=1&act=resultscsv
    so as long as we have a list of permits we can download all event results basically just by iterating through ids

  Note that for non-existent event it would still download results file


  Unfortunately we would probably need to download both CSVs since one has racer's City/State and another
  one doesn't. Or maybe we can use racer database we scraped before, but it's less accurate since
  state could change from the momemnt we pulled it.

  About 2000-3000 events a year x 2csv x 10-12 years = ~40000-7200 requests

  50000 requests with concurrency of 3 with 1s interval is 166000 seconds / 3600 = ~4-5 hours
**/
