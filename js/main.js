const parseDate = d3.timeParse('%Y-%m-%d')

d3.csv('data/laureates.csv').then(_data => {
    data = _data

    // Format columns to numerical or date for easier parsing.
    data.forEach(d => {
        d.awardYear = +d.awardYear
        d.prizeAmountAdjusted = + d.prizeAmountAdjusted
        d.dateAwarded = parseDate(d.dateAwarded)
        d.birth_date = parseDate(d.birth_date)
        d.death_date = parseDate(d.death_date)
    })

    console.log("Data: ", data)
})