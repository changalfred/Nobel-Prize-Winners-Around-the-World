class NobelPrizeWorldMap {
    constructor(_config, _commonData, _winningestCountryData, _minMaxWinnersPerCountryData, _nobelPrizeData) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth,
            containerHeight: _config.containerHeight,
            margin: {top: 35, right: 10, bottom: 10, left: 35},
            tooltipPadding: 10,
            legendMarginTop: 375,
            legendMarginLeft: 35,
            legendWidth: 150,
            legendHeight: 20
        }

        this.commonData = _commonData;
        this.winningestCountryData = _winningestCountryData;
        this.minMaxWinnersPerCountryData = _minMaxWinnersPerCountryData;
        this.nobelPrizeData = _nobelPrizeData;
        this.initVis();
    };

    initVis() {
        let vis = this

        // Set margins.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.svg.append('text')
            .text('Distribution of Winners By Country');

        vis.map = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

        // Initialize projection and path generator.
        vis.projection = d3.geoEquirectangular()    // Easiest to point at small countries with cursor.
            .scale([vis.width / (2 * Math.PI)])
            .translate([vis.width / 2, vis.height / 2])
        vis.geoPath = d3.geoPath().projection(vis.projection);

        vis.colorScale = d3.scaleThreshold()
            .range(d3.schemeYlGn[6]);
        console.log(vis.colorScale.range())

        // Annotation.
        vis.annotations = [{
            note: { label: 'USA has the most laureates at 272.',
                    textSize: 12,
                    wrap: 135 },
            className: 'anomaly',
            connector: { end: 'dot' },
            color: ['#cc0000'],
            x: 280,
            y: 270,
            dx: 10,
            dy: 10
        }];

        vis.annotationBind = vis.map.append('g')
            .style('font-size', 12);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        let winnersCountByCountryExtent = [0, 25, 50, 75, 100];
        vis.colorScale.domain(winnersCountByCountryExtent);

        vis.renderVis();
        vis.renderLegend();
    }

    renderVis() {
        let vis = this;

        // Convert TopoJson -> GeoJson.
        const countries = topojson.feature(vis.commonData, vis.commonData.objects.countries);

        // Need count of winners per country when binding to determine colour saturation.
        const countWinnerByCountryData = d3.rollups(vis.nobelPrizeData, v => v.length, d => d.birth_countryNow);

        // Scale projection so geometry fits in svg area.
        vis.projection.fitSize([vis.width, vis.height], countries);

        vis.countryPath = vis.map.selectAll('.country')
            .data(countries.features)
            .join('path')
            .attr('class', 'country')
            .attr('d', vis.geoPath)
            .attr('stroke', 'black')
            .attr('stroke-width', 0.5)
            .attr('fill', d => {
                if (d.properties.winnerCount) {
                    return vis.colorScale(d.properties.winnerCount);
                } else {
                    return d3.schemeYlGn[6][0];
                }
            })
            .on('mouseover', function (event, d) {
                if (d.properties.winnerCount > 0) {
                    d3.selectAll('.country')
                        .style('opacity', 0.5);

                    d3.select('#map-tooltip')
                        .style('display', 'block')
                        .style('background', 'white')
                        .style('border', 'solid')
                        .style('border-radius', '5px')
                        .style('padding', vis.config.tooltipPadding)
                        .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                        .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                        .html(`<div class='tooltip-title'>
                        <div><b>${d.properties.name}</b></div>
                        <p></p>
                        <div>Winner count: ${d.properties.winnerCount}</div>
                        <div>Total prize (USD): $${Number(d.properties.totalPrizeMoney).toLocaleString()}</div>
                        <div>Biggest winner: ${d.properties.biggestWinner} ($${Number(d.properties.biggestWinnerPrize).toLocaleString()})</div>
                        <div>Smallest winner: ${d.properties.smallestWinner} ($${Number(d.properties.smallestWinnerPrize).toLocaleString()})</div>
                        </div>`);

                    d3.select(this)
                        .style('stroke-width', 1.5)
                        .style('opacity', 1);
                }
            })
            .on('mouseleave', function (event, d) {
                d3.selectAll('.country')
                    .style('opacity', 1);

                d3.select('#map-tooltip')
                    .style('display', 'none');

                d3.select(this)
                    .style('stroke-width', 0.5);
            })
            .on('click', function (event, d) {

            })
            .on('dblclick', function (event, d) {
                // Innovative view.
                if (d.properties.winnerCount > 0) {
                    const zoom = d3.zoom()
                        .scaleExtent([1, 30])
                        .on('zoom', function (event) {
                            const {transform} = event;
                            vis.map.attr("transform", transform);

                            // 1. Scale in entirely on first double click (all zoom functions allowed).

                            // 2. Show dot density map everywhere once scaled in (all zoom functions allowed).

                            // 3. When click on a dot, separate country from all of map. Show
                            // individual stats on right (see drawing). No zoom functions allowed.

                            // 4. Clicking anywhere outside a dot returns to scaled dot density map (same as 2.).

                            // 5. Double click again to return to original view of all views.
                        })

                    vis.svg.call(zoom)
                        .on('wheel.zoom', null);
                        // .on('mousedown.zoom', null)
                        // .on('touchmove.zoom', null)
                        // .on('touchstart.zoom', null)
                }
            })

        // Create the annotation.
        const liveAnnotation = d3.annotation().annotations(vis.annotations);

        vis.annotationBind
            .call(liveAnnotation);
    }

    renderLegend() {
        let vis = this;

        vis.legendLinear = vis.map.append('g')
            .attr('class', 'legend-threshold')
            .attr('transform', `translate(${vis.config.legendMarginLeft}, ${vis.config.legendMarginTop})`)

        // TODO: Uncomment this and show view and web example.
        // vis.legendLinear.selectAll('rect')
        //     .each(function (d, i, nodes) {
        //         console.log('d, i, nodes', d, i, nodes)
        //         nodes[i].classList.add(vis.colorScale(d))
        //     })

        vis.legendLinear = d3.legendColor().shapeWidth(40)
            .orient('vertical')
            .title('Winner Count')
            .shapePadding(-3)
            .labels(['<1', '1 - 25', '26 - 50', '51 - 75', '76 - 100', '>100'])
            .labelFormat(d3.format(','))
            .scale(vis.colorScale)
            // .useClass(true)  // TODO: Uncomment this and show view and web example.
            .on('cellover', function (d, i, event) {
                const countries = topojson.feature(vis.commonData, vis.commonData.objects.countries);
                let countryIds = []
                let count = d3.select(this)._groups[0][0].textContent

                if (count === '<1') {
                    console.log(countries)
                    d3.selectAll('.country')
                        .style('opacity', 0.5);

                    let item = countries.features
                    for (let i = 0; i < item.length; i++) {
                        console.log('Properties: ', item[i])
                        if (item[i].properties.winnerCount === 0) {
                            // const match = item[i].classed('match-legend-bin')
                            let countryId = item[i].id
                            countryIds.push(countryId)
                            // vis.countryPath     // Take only relevant country paths.
                            //     .style('stroke-width', 1.5)
                            //     .style('opacity', 1)
                        }
                    }

                    d3.selectAll('.match-legend-bin')
                        .style('stroke-width', 1.5)
                        .style('opacity', 1)
                } else if (count === '1 - 25') {

                } else if (count === '26 - 50') {

                } else if (count === '51 - 75') {

                } else if (count === '76 - 100') {

                } else {

                }

                d3.selectAll('.country')
                    .style('stroke-width', 1.5)
                    .style('opacity', 1)
            })
            .on('cellout', function (d, event) {
                console.log('Cell out.')
                d3.selectAll('.country')
                    .style('opacity', 1)
                    .style('stroke-width', 0.5)

                // d3.select(this)
                //     .style('stroke-width', 0.5);
            })

        vis.map.select('.legend-threshold')
            .call(vis.legendLinear)
    }
}