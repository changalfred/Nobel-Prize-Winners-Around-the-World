const parseDate = d3.timeParse('%Y-%m-%d')

function rollupData(csvData) {
    return d3.rollups(csvData, v => v.length, d => d.birth_countryNow)
}

function joinData(topoMap, csvData) {
    const mapItems = topoMap.objects.countries.geometries

    for (let i = 0; i < csvData.length; i++) {
        let csvItem = csvData[i]
        let csvKey = csvItem[0]
        let csvValue = csvItem[1]

        for (let j = 0; j < mapItems.length; j++) {
            let mapItem = mapItems[j]
            let mapKey = mapItem.properties.name

            // console.log('Map key: ', mapKey)

            if (csvKey === mapKey) {
                mapItem.properties.winnerCount = csvValue
            } else {
                mapItem.properties.winnerCount = 0
            }
        }
    }

    return topoMap
}

// Main function.
Promise.all([
    d3.json('data/countries-110m.json'),
    d3.csv('data/laureates.csv')
]).then(data => {
    const geoData = data[0]
    const nobelPrizeData = data[1]

    // Format columns to numerical or date for easier use.
    nobelPrizeData.forEach(d => {
        d.awardYear = +d.awardYear
        d.prizeAmountAdjusted = +d.prizeAmountAdjusted
        d.dateAwarded = parseDate(d.dateAwarded)
        d.birth_date = parseDate(d.birth_date)
        d.death_date = parseDate(d.death_date)
    })

    let rollupCountWinnerPerCountryData = rollupData(nobelPrizeData)
    let commonData = joinData(geoData, rollupCountWinnerPerCountryData)
})
