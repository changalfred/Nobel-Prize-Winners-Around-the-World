function convertField(csvData, from, to) {
    for (let i = 0; i < csvData.length; i++) {
        if (csvData[i].birth_countryNow === from) {
            csvData[i].birth_countryNow = to
        }
    }
}

// Roll up data here.
function rollupData(csvData) {
    let data = []

    // Data stores winner count per country to show colour saturation on map.
    let rollupWinnersPerCountry = d3.rollups(csvData, v => v.length, d => d.birth_countryNow)
    data.push(rollupWinnersPerCountry)

    // Data stores total prize per country for tooltip in map.
    let rollupPrizePerCountry = d3.rollups(csvData, v => d3.sum(v, v => v.prizeAmountAdjusted), d => d.birth_countryNow)
    data.push(rollupPrizePerCountry)

    return data
}

// Group data here.
function groupData(csvData) {
    return d3.groups(csvData, d => d.birth_countryNow)
}

// Find min and max of data.
function minMax(csvData) {
    let minMax = []
    let minItemByCountry = []
    let maxItemByCountry = []

    for (let i = 0; i < csvData.length; i++) {
        let item = csvData[i][1]
        let minItem = item[0]

        for (let j = 0; j < item.length; j++) {
            let min = []

            // Find min.
            if (item[j].prizeAmountAdjusted < minItem.prizeAmountAdjusted) {
                min = item[j]
                minItem = min
            }
        }

        minItemByCountry.push(minItem)
    }

    for (let i = 0; i < csvData.length; i++) {
        let item = csvData[i][1]
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

    minMax.push(minItemByCountry)
    minMax.push(maxItemByCountry)

    return minMax
}

function filterMapData(data, key) {
    let mapItems = data.objects.countries.geometries

    for (let i = 0; i < mapItems.length; i++) {
        if (mapItems[i].properties.name === key) {
            mapItems.splice(i, 1)
        }
    }
}

function filterWinnersByUsaData(data, key) {
    let usWinnersData = []

    let rollupWinnersPerCountry = d3.groups(data, d => d.birth_countryNow)

    for (let i = 0; i < rollupWinnersPerCountry.length; i++) {
        if (rollupWinnersPerCountry[i][0] === 'United States of America') {
            usWinnersData.push(rollupWinnersPerCountry[i])
            break
        }
    }

    // Group data by city.
    let cityWinnersData = []
    let groupByCity = d3.groups(usWinnersData, function (d) {
        let winners = d[1]
        // console.log('Winners: ', winners)
        for (let i = 0; i < winners.length; i++) {
            let city = winners[i].birth_cityNow.substring(0, winners[i].birth_cityNow.indexOf(','))
            // console.log('City: ', city, ' Key: ', key)
            if (city === key) {
                return cityWinnersData.push(city, winners[i])
            }
        }
    })

    return cityWinnersData
}

function filterCsvData(data, key) {
    return data.filter(d => d.birth_countryNow === key[0])
}

function filterCsvDataWithKeys(data, keys) {
    let newData = data

    newData = newData.filter(function (d) {
       return keys.includes(d.category)
    })

    return newData
}

// Join data here.
function joinData(topoMap, csvData, minMaxWinnersPerCountryData) {
    const mapItems = topoMap.objects.countries.geometries

    let winnerPerCountryItem = csvData[0]
    let prizeTotalPerCountryItem = csvData[1]

    let minWinner = minMaxWinnersPerCountryData[0]
    let maxWinner = minMaxWinnersPerCountryData[1]

    for (let i = 0; i < mapItems.length; i++) {
        let mapItem = mapItems[i]
        let mapKey = mapItem.properties.name

        for (let j = 0; j < winnerPerCountryItem.length; j++) {
            // Keys and values for winner count per country.
            let winnerPerCountryItemElement = winnerPerCountryItem[j]
            let winnerKey = winnerPerCountryItemElement[0]
            let winnerValue = winnerPerCountryItemElement[1]
            // console.log('Winner value: ', winnerPerCountryItemElement)

            // Keys and values for total prize money per country.
            let prizeTotalPerCountryItemElement = prizeTotalPerCountryItem[j]
            let prizeKey = prizeTotalPerCountryItemElement[0]
            let prizeValue = prizeTotalPerCountryItemElement[1]

            // Keys and values for biggest and smallest winner per country.
            let smallestWinner = minWinner[j]
            let biggestWinner = maxWinner[j]

            // Don't put an else statement and set winnerCount = 0 because it sets all values to 0.
            if (mapKey === winnerKey) {
                mapItem.properties.winnerCount = winnerValue
            }
            if (mapKey === prizeKey) {
                mapItem.properties.totalPrizeMoney = prizeValue
            }
            if (mapKey === smallestWinner.birth_countryNow) {
                mapItem.properties.smallestWinner = smallestWinner.fullName
                mapItem.properties.smallestWinnerPrize = smallestWinner.prizeAmountAdjusted
            }
            if (mapKey === biggestWinner.birth_countryNow) {
                mapItem.properties.biggestWinner = biggestWinner.fullName
                mapItem.properties.biggestWinnerPrize = biggestWinner.prizeAmountAdjusted
            }
        }
    }

    // Set remaining countries without any winners to have winnerCount = 0.
    for (let i = 0; i < mapItems.length; i++) {
        if (!mapItems[i].properties.winnerCount) {
            mapItems[i].properties.winnerCount = 0
        }
    }

    return topoMap
}