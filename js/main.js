const parseDate = d3.timeParse('%Y-%m-%d')

const treemapDispatcher = d3.dispatch('treemapFilter');

// filteredCategories: select a category on bar chart to filter countries that have
// winners belonging to category (can have multiple categories).
// filteredCountry: select a country to show prize winnings of each category in that country.
const worldMapBarChartDispatcher = d3.dispatch('filteredCategories', 'filteredCountry')

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
        d.affiliation_1 = d.affiliation_1.split(",");
    })

    // Manipulate data.
    convertField(nobelPrizeData, 'USA', 'United States of America')
    filterData(geoData, 'Antarctica')
    let rolledData = rollupData(nobelPrizeData)
    let minMaxData = minMax(groupData(nobelPrizeData))
    let commonData = joinData(geoData, rolledData, minMaxData)

    console.log('Common data: ', commonData)

    const prizeWorldMap = new NobelPrizeWorldMap({
        parentElement: '#vis-container-map',
        containerWidth: 1000,
        containerHeight: 500
    }, commonData, nobelPrizeData, worldMapBarChartDispatcher)
    prizeWorldMap.updateVis()

    const densityMap = new DotDensityMap({
        parentElement: '#vis-container-dot-density-map',
        containerWidth: 400,
        containerHeight: 400
    }, commonData, nobelPrizeData)
    densityMap.updateVis()

    const treemap = new Treemap({
        parentElement: '#treemap',
        containerWidth: 500,
        containerHeight: 500
    }, treemapDispatcher, nobelPrizeData);
    treemap.updateVis();

    const bar_chart = new BarChart({
        parentElement: '#vis-prize-per-category',
    }, nobelPrizeData);
    bar_chart.updateVis();
})