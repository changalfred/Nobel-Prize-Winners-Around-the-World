const parseDate = d3.timeParse('%Y-%m-%d')

const treemapDispatcher = d3.dispatch('treemapFilter');

d3.csv('data/laureates.csv').then(_data => {
    var data = _data

    // Format columns to numerical or date for easier parsing.
    data.forEach(d => {
        d.awardYear = +d.awardYear
        d.prizeAmountAdjusted = + d.prizeAmountAdjusted
        d.dateAwarded = parseDate(d.dateAwarded)
        d.birth_date = parseDate(d.birth_date)
        d.death_date = parseDate(d.death_date)
        d.affiliation_1 = d.affiliation_1.split(",");
    })

    const treemap = new Treemap({
        parentElement: '#treemap',
    }, treemapDispatcher, data);
    treemap.updateVis();
})