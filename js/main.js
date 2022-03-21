const parseDate = d3.timeParse('%Y-%m-%d')

// Ensure fields match values in json data.
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
    let data = []

    // Data stores winner count per country to show colour saturation on map.
    let rollupWinnersPerCountry = d3.rollups(csvData, v => v.length, d => d.birth_countryNow)
    data.push(rollupWinnersPerCountry)

    // Data stores total prize per country for tooltip in map.
    let rollupPrizePerCountry = d3.rollups(csvData, v => d3.sum(v, d => d.prizeAmountAdjusted), d => d.birth_countryNow)
    data.push(rollupPrizePerCountry)

    return data
}

// Group data here.
function groupData(csvData) {
    return d3.groups(csvData, d => d.birth_countryNow)
}

// Find min and max of data.
// TODO: Clean up this function.
function minMax(data) {
    let minMax = []
    let minItemByCountry = []
    let maxItemByCountry = []

    for (let i = 0; i < data.length; i++) {
        let item = data[i][1]
        let minItem = item[0]

        for (let j = 0; j < item.length; j++) {
            let min = []

            // Find min.
            if (item[j].prizeAmountAdjusted < minItem.prizeAmountAdjusted) {
                min = item[j]       // item[j] must be of type array because later iterations do not compare, since minItem[1] is not an array but an array of object.
                                    // This means only the first item of each country is pushed to return result.
                minItem = min
            }
        }

        minItemByCountry.push(minItem)
    }

    for (let i = 0; i < data.length; i++) {
        let item = data[i][1]
        let maxItem = item[0]

        for (let j = 0; j < item.length; j++) {
            let max = []

            // Find max.
            if (item[j].prizeAmountAdjusted > maxItem.prizeAmountAdjusted) {
                max = item[j]
                maxItem = max
            }
        }

        maxItemByCountry.push(maxItem)
    }

    return minMax.push(minItemByCountry, maxItemByCountry)
}

// Filter data here.
function filterData(rolledUpData) {
    let max = []

    // Find country with most winners.
    let maxWinnerCountry = ['', 0]
    for (let i = 0; i < rolledUpData[0].length; i++) {
        let rolledUpItem = rolledUpData[0][i]

        if (rolledUpItem[1] > maxWinnerCountry[1]) {
            maxWinnerCountry = rolledUpItem
        }
    }
    max.push(maxWinnerCountry)

    return max
}

// Join data here.
function joinData(topoMap, csvData) {
    const mapItems = topoMap.objects.countries.geometries

    let winnerPerCountryItem = csvData[0]
    let prizeTotalPerCountryItem = csvData[1]

    for (let i = 0; i < winnerPerCountryItem.length; i++) {
        // Keys and values for winner count per country.
        let winnerPerCountryItemElement = winnerPerCountryItem[i]
        let winnerKey = winnerPerCountryItemElement[0]
        let winnerValue = winnerPerCountryItemElement[1]

        // Keys and values for total prize money per country.
        let prizeTotalPerCountryItemElement = prizeTotalPerCountryItem[i]
        let prizeKey = prizeTotalPerCountryItemElement[0]
        let prizeValue = prizeTotalPerCountryItemElement[1]

        for (let j = 0; j < mapItems.length; j++) {
            let mapItem = mapItems[j]
            let mapKey = mapItem.properties.name

            // Don't put an else statement and set winnerCount = 0 because it sets all values to 0.
            if (winnerKey === mapKey) {
                mapItem.properties.winnerCount = winnerValue
            }
            if (prizeKey === mapKey) {
                mapItem.properties.totalPrizeMoney = prizeValue
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
    let rolledUpData = rollupData(abbreviationToFullData)
    let winningestCountryData = filterData(rolledUpData)     // Contains country with max winners.
    let minMaxWinnersPerCountryData = minMax(groupData(nobelPrizeData))    // Contains winners of each country.
    let commonData = joinData(geoData, rolledUpData)

    // console.log('Common data: ', commonData)

    const prizeWorldMap = new NobelPrizeWorldMap({
        parentElement:  '#vis-container-map',
        containerWidth: 1000,
        containerHeight: 800
    }, commonData, winningestCountryData, minMaxWinnersPerCountryData, nobelPrizeData)

    prizeWorldMap.updateVis()
})
