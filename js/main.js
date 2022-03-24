const parseDate = d3.timeParse('%Y-%m-%d')

const treemapDispatcher = d3.dispatch('treemapFilter');

d3.csv('data/laureates.csv').then(_data => {
    let data = _data

    // Format columns to numerical or date for easier parsing.
    data.forEach(d => {
        d.awardYear = +d.awardYear
        d.prizeAmountAdjusted = +(d.prizeAmountAdjusted.substring(1).replace(/[.,]/g, ''))
        d.dateAwarded = parseDate(d.dateAwarded)
        d.birth_date = parseDate(d.birth_date)
        d.death_date = parseDate(d.death_date)
        d.affiliation_1 = d.affiliation_1.split(",");
    })

    const treemap = new Treemap({
        parentElement: '#treemap',
    }, treemapDispatcher, data);
    treemap.updateVis();

    const bar_chart = new BarChart({
        parentElement: '#vis-prize-per-category',
    }, data);
    bar_chart.updateVis();
})