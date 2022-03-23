class NobelPrizeWorldMap {
    constructor(_config, _commonData, _winningestCountryData, _minMaxWinnersPerCountryData, _nobelPrizeData) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth,
            containerHeight: _config.containerHeight,
            margin: {top: 35, right: 10, bottom: 10, left: 35},
            tooltipPadding: 10,
            legendMarginTop: 450,
            legendMarginLeft: 35,
            legendWidth: 150,
            legendHeight: 20
        }

        this.commonData = _commonData
        this.winningestCountryData = _winningestCountryData
        this.minMaxWinnersPerCountryData = _minMaxWinnersPerCountryData
        this.nobelPrizeData = _nobelPrizeData
        this.initVis()
    }

    initVis() {
        let vis = this

        // Set margins.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom

        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)

        vis.map = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`)

        // Initialize projection and path generator.
        vis.projection = d3.geoEquirectangular()    // Easiest to point at small countries with cursor.
            .scale([vis.width / (2 * Math.PI)])
            .translate([vis.width / 2, vis.height / 2])
        vis.geoPath = d3.geoPath().projection(vis.projection)

        vis.colorScale = d3.scaleThreshold()
            .range(d3.schemeYlGn[9])

        // Set up legend.
        vis.linearGradient = vis.svg.append('defs')
            .append('linearGradient')
            .attr('id', 'legend-gradient')

        vis.legend = vis.map.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.config.legendMarginLeft}, ${vis.config.legendMarginTop})`)

        vis.legendRect = vis.legend.append('rect')
            .attr('width', vis.config.legendWidth)
            .attr('height', vis.config.legendHeight)

        vis.legendTitle = vis.legend.append('text')
            .attr('class', 'legend-title')
            .attr('dy', '.35em')
            .attr('y', -10)
            .attr('text-anchor', 'center')
            .text('Winners Per Country')

        // Annotation.
        vis.annotations = [{
            note: { label: 'USA has the most laureates (272). Second is UK (87). ',
                    textSize: 12,
                    wrap: 135 },
            className: 'anomaly',
            connector: { end: 'dot' },
            color: ['#cc0000'],
            // data: { name: 'United States of America'},
            x: 320,
            y: 300,
            dx: 10,
            dy: 10
            // type: d3.annotationCalloutCircle,
            // subject: { radius: 60 },
            // data: { name: 'United States of America'}
            // dx: 70
        }]

        vis.annotationBind = vis.svg.append('g')
            .style('font-size', 12)

        vis.updateVis()
    }

    updateVis() {
        let vis = this

        let winnersCountByCountryExtent = [0, 20, 40, 60, 80, 100, 120, 140, 160]
        vis.colorScale.domain(winnersCountByCountryExtent)

        vis.legendStops = [{color: d3.schemeYlGn[9][0], value: winnersCountByCountryExtent[0], offset: 0},
            {color: d3.schemeYlGn[9][8], value: winnersCountByCountryExtent[winnersCountByCountryExtent.length - 1],
                offset: 100}]

        vis.renderVis()
        vis.renderLegend()
    }

    renderVis() {
        let vis = this

        // Convert TopoJson -> GeoJson.
        const countries = topojson.feature(vis.commonData, vis.commonData.objects.countries)

        // Need count of winners per country when binding to determine colour saturation.
        const countWinnerByCountryData = d3.rollups(vis.nobelPrizeData, v => v.length, d => d.birth_countryNow)

        // Scale projection so geometry fits in svg area.
        vis.projection.fitSize([vis.width, vis.height], countries)

        // // Multi-purpose tooltip.
        // const tooltip = d3.select('#map-tooltip')
        //     .append('div')
        //     .style('background-color', 'white')
        //     .style('border', 'solid')
        //     .style('border-width', '0.5px')
        //     .style('broder-radius', '5px')
        //     .style('padding', vis.config.tooltipPadding)
        //
        // // Show tooltip and transition.
        // let mouseOverCountry = function(event, d) {
        //     d3.selectAll('.country')
        //         .style('opacity', 0.5)
        //
        //     console.log('Vis data: ', d)
        //
        //     tooltip.style('display', 'block')
        //         .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
        //         .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
        //         .html(`<div class='tooltip-title'>
        //                 <div>${d.properties.name}</div>
        //                 <div>Winner count: ${d.winnerCount}</div>
        //                 <div>Total prize: ${d.totalPrizeMoney}</div>
        //                 <div>Largest winner: ${d.biggestWinner}, ${d.biggestWinnerPrize}</div>
        //                 <div>Smallest winner: ${d.smallestWinner}, ${d.smallestWinnerPrize}</div>
        //                 </div>`)
        //     d3.select(this)
        //         .style('stroke-width', 1.5)
        //         .style('opacity', 1)
        // }
        //
        // // Hide tooltip and transition.
        // let mouseLeaveCountry = function(event, d) {
        //     d3.selectAll('.country')
        //         .style('opacity', 1)
        //     d3.select(this)
        //         .style('stroke-width', 0.5)
        //     tooltip.style('display', 'none')
        // }
        //
        // // Click on country once.
        // let mouseClickCountry = function(event, d) {
        //
        // }
        //
        // // Click on country twice.
        // let mouseDoubleClickCountry = function(event, d) {
        //
        //
        // }

        const countryPath = vis.map.selectAll('.country')
            .data(countries.features)
            .join('path')
            .attr('class', 'country')
            .attr('d', vis.geoPath)
            .attr('stroke', 'black')
            .attr('stroke-width', 0.5)
            .attr('fill', d => {
                if (d.properties.winnerCount) {
                    return vis.colorScale(d.properties.winnerCount)
                } else {
                    return 'white'
                }
            })
            .on('mouseover', function (event, d) {
                if (d.properties.winnerCount > 0) {
                    d3.selectAll('.country')
                        .style('opacity', 0.5)

                    d3.select('#map-tooltip')
                        .style('display', 'block')
                        .style('background', 'white')
                        .style('border', 'solid')
                        .style('broder-radius', '5px')
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
                        </div>`)

                    d3.select(this)
                        .style('stroke-width', 1.5)
                        .style('opacity', 1)
                }
            })
            .on('mouseleave', function (event, d) {
                d3.selectAll('.country')
                    .style('opacity', 1)

                d3.select('#map-tooltip')
                    .style('display', 'none')

                d3.select(this)
                    .style('stroke-width', 0.5)
            })
            .on('click', function (event, d) {

            })
            .on('dblclick', function (event, d) {
                // Innovative view.

            })
            // .on('mouseover', mouseOverCountry)
            // .on('mouseleave', mouseLeaveCountry)
            // .on('click', mouseClickCountry)
            // .on('dblclick', mouseDoubleClickCountry)

        // Create the annotation.
        const liveAnnotation = d3.annotation().annotations(vis.annotations)

        vis.annotationBind
            .call(liveAnnotation)
    }

    renderLegend() {
        let vis = this

        vis.legend.selectAll('.legend-label')
            .data(vis.legendStops)
            .join('text')
            .attr('class', 'legend-label')
            .attr('dy', '.35em')
            .attr('y', 20)
            .attr('x', (d, i) => {
                return i === 0 ? 0 : vis.config.legendWidth
            })
            .text(d => Math.round(d.value * 10) / 10)

        vis.linearGradient.selectAll('.stop')
            .data(vis.legendStops)
            .join('stop')
            .attr('offset', d => d.offset)
            .attr('stop-color', d => d.color)

        vis.legendRect.attr('fill', 'url(#legend-gradient)')
    }
}