const parseDate = d3.timeParse('%Y-%m-%d')

function changeField(csvData) {
    for (let i = 0; i < csvData.length; i++) {
        if (csvData[i].birth_countryNow === 'USA') {
            csvData[i].birth_countryNow = 'United States of America'
        }
    }

    return csvData
}

// Roll up data here.
function rollupData(csvData) {
    return d3.rollups(csvData, v => v.length, d => d.birth_countryNow)
}

// Join data here.
function joinData(topoMap, csvData) {
    const mapItems = topoMap.objects.countries.geometries

    for (let i = 0; i < csvData.length; i++) {
        let csvItem = csvData[i]
        let csvKey = csvItem[0]
        let csvValue = csvItem[1]

        for (let j = 0; j < mapItems.length; j++) {
            let mapItem = mapItems[j]
            let mapKey = mapItem.properties.name

            // Don't put an else statement and set winnerCount = 0 because it sets all values to 0.
            if (csvKey === mapKey) {
                mapItem.properties.winnerCount = csvValue
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

    let abbreviationToFullData = changeField(nobelPrizeData)
    let rollupCountWinnerPerCountryData = rollupData(abbreviationToFullData)
    let commonData = joinData(geoData, rollupCountWinnerPerCountryData)

    console.log('Common data: ', commonData)

    const prizeWorldMap = new NobelPrizeWorldMap({
        parentElement:  '#vis-container-map',
        containerWidth: 1000,
        containerHeight: 800
    }, commonData, nobelPrizeData)

    prizeWorldMap.updateVis()
})
