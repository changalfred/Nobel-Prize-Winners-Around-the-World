const parseDate = d3.timeParse('%Y-%m-%d')

let worldMap, treeMap, barChart
let geoData, commonData, nobelPrizeData

// filteredCategories: select at least one category on bar chart to filter countries that have
// winners belonging to category
// filteredCountry: select a country to show prize winnings of each category in that country
const worldMapBarChartDispatcher = d3.dispatch('filterCategories', 'filterCountry')
const innovativeMapIndividualWinnersDispatcher = d3.dispatch('filterCities', 'filterWinners')
const treemapDispatcher = d3.dispatch('treemapFilter');

// Main function.
Promise.all([
    d3.json('data/countries-110m.json'),
    d3.csv('data/laureates.csv'),
    d3.csv('data/us-cities.csv')
]).then(data => {
    geoData = data[0]
    nobelPrizeData = data[1]
    const usCitiesData = data[2]

    // nobelPrizeData = d3.filter(nobelPrizeData, d => d.birth_countryNow === 'USA')
    // // Check how many matching cities.
    // let matchCount = 0
    // let matchingCities = new Set()
    // for (let i = 0; i < nobelPrizeData.length; i++) {
    //     let nobelItem = nobelPrizeData[i]
    //     for (let j = 0; j < usCitiesData.length; j++) {
    //         let cityItem = usCitiesData[j]
    //         if (cityItem.city === nobelItem.birth_cityNow.substring(0, nobelItem.birth_cityNow.indexOf(','))) {
    //             matchingCities.add(cityItem.city)
    //             matchCount++    // 223, but only 94 unique matching cities.
    //         }
    //     }
    // }

    // Format columns to numerical or date for easier use.
    nobelPrizeData.forEach(d => {
        d.awardYear = +d.awardYear
        d.prizeAmountAdjusted = +d.prizeAmountAdjusted
        d.dateAwarded = parseDate(d.dateAwarded)
        d.birth_date = parseDate(d.birth_date)
        d.death_date = parseDate(d.death_date)
        d.affiliation_1 = d.affiliation_1.split(",")
    })

    usCitiesData.forEach(d => {
        d.lat = +d.lat
        d.lon = +d.lon
    })

    // Manipulate data.
    convertField(nobelPrizeData, 'USA', 'United States of America')
    filterMapData(geoData, 'Antarctica')
    let rolledData = rollupData(nobelPrizeData)
    let minMaxData = minMax(groupData(nobelPrizeData))
    commonData = joinData(geoData, rolledData, minMaxData)

    // console.log('Common data: ', commonData)

    worldMap = new NobelPrizeWorldMap({
        parentElement: '#vis-container-map',
        containerWidth: 1000,
        containerHeight: 500
    }, commonData, nobelPrizeData, worldMapBarChartDispatcher)
    worldMap.updateVis()

    const innovativeMap = new InnovativeMap({
        parentElement: '#vis-container-innovative-map',
        containerWidth: 1000,
        containerHeight: 800
    }, commonData, nobelPrizeData, usCitiesData, innovativeMapIndividualWinnersDispatcher)
    innovativeMap.updateVis()

    const individualWinnersView = new WinnersSmallMultiples({
        parentElement: '#vis-container-individual-winners',
        containerWidth: 500,
        containerHeight: 150
    }, nobelPrizeData, usCitiesData, innovativeMapIndividualWinnersDispatcher)
    individualWinnersView.updateVis()

    treeMap = new Treemap({
        parentElement: '#treemap',
        containerWidth: 500,
        containerHeight: 500
    }, treemapDispatcher, nobelPrizeData);
    treeMap.updateVis();

    barChart = new BarChart({
        parentElement: '#vis-prize-per-category',
    }, nobelPrizeData, worldMapBarChartDispatcher);
    barChart.updateVis();
})

// Show average prize money of each category of winners in selected country.
worldMapBarChartDispatcher.on('filterCountry', selectedCountry => {
    if (selectedCountry === null) {
        barChart.data = nobelPrizeData
    } else {
        // Filter data to only include data with selected country.
        barChart.data = filterCsvData(nobelPrizeData, selectedCountry)
    }

    barChart.updateVis()
})

// Show countries with winners in selected categories.
worldMapBarChartDispatcher.on('filterCategories', selectedPrizeCategories => {
    if (selectedPrizeCategories.length === 0) {
        let rolledData = rollupData(nobelPrizeData)
        let minMaxData = minMax(groupData(nobelPrizeData))
        commonData = joinData(geoData, rolledData, minMaxData)
        worldMap.commonData = commonData
    } else {
        let nobelPrizeDataWithSpecificCategories = filterCsvDataWithKeys(nobelPrizeData, selectedPrizeCategories)
        let rolledData = rollupData(nobelPrizeDataWithSpecificCategories)
        let minMaxData = minMax(groupData(nobelPrizeDataWithSpecificCategories))
        worldMap.commonData = joinData(geoData, rolledData, minMaxData)
    }

    worldMap.updateVis()
})

// Show winners in of selected cities.
innovativeMapIndividualWinnersDispatcher.on('filterCities', selectedCities => {

})

// Show city of selected winner.
innovativeMapIndividualWinnersDispatcher.on('filterWinners', selectedWinners => {

})