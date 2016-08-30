# usac-scraper

### Results
If following results url mutltiple results open, e.g.:
http://www.usacycling.org/results/?year=2012&id=1340

using inspector we can figure out what `info_id` is used and construct url in the following way:

http://www.usacycling.org/results/?year=2012&id=1340&info_id=50193

That would directly open race results. This effectively removes the need to "click" on links and execute javascript.
