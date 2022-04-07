const parseDate = d3.timeParse('%Y-%m-%d')

let worldMap, treeMap, barChart
let geoData, commonData, nobelPrizeData

// filteredCategories: select a category on bar chart to filter countries that have
// winners belonging to category (can have multiple categories).
// filteredCountry: select a country to show prize winnings of each category in that country
// (only one country can be selected at any point).
const worldMapBarChartDispatcher = d3.dispatch('filterPrizeCategories', 'filterCountry')
const treemapDispatcher = d3.dispatch('treemapFilter');

// Main function.
Promise.all([
    d3.json('data/countries-110m.json'),
    d3.csv('data/laureates.csv')
]).then(data => {
    geoData = data[0]
    nobelPrizeData = data[1]

    // Format columns to numerical or date for easier use.
    nobelPrizeData.forEach(d => {
        d.awardYear = +d.awardYear
        d.prizeAmountAdjusted = +d.prizeAmountAdjusted
        d.dateAwarded = parseDate(d.dateAwarded)
        d.birth_date = parseDate(d.birth_date)
        d.death_date = parseDate(d.death_date)
        d.affiliation_1 = d.affiliation_1.split(",");
    })

    // Manipulate data.
    convertField(nobelPrizeData, 'USA', 'United States of America')
    filterMapData(geoData, 'Antarctica')
    let rolledData = rollupData(nobelPrizeData)
    let minMaxData = minMax(groupData(nobelPrizeData))
    commonData = joinData(geoData, rolledData, minMaxData)

    console.log('Common data: ', commonData)

    worldMap = new NobelPrizeWorldMap({
        parentElement: '#vis-container-map',
        containerWidth: 1000,
        containerHeight: 500
    }, commonData, nobelPrizeData, worldMapBarChartDispatcher)
    worldMap.updateVis()

    const densityMap = new DotDensityMap({
        parentElement: '#vis-container-dot-density-map',
        containerWidth: 400,
        containerHeight: 400
    }, commonData, nobelPrizeData)
    densityMap.updateVis()

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

worldMapBarChartDispatcher.on('filterCountry', selectedCountry => {
    if (selectedCountry === null) {
        barChart.data = nobelPrizeData
    } else {
        // Filter data to only include data with selected country.
        barChart.data = filterCsvData(nobelPrizeData, selectedCountry)
    }

    // console.log('Barchart data: ', barChart.data)

    barChart.updateVis()
})

worldMapBarChartDispatcher.on('filterPrizeCategories', selectedPrizeCategories => {
    if (selectedPrizeCategories.length === 0) {
        worldMap.commonData = commonData
    }

    worldMap.updateVis()
})