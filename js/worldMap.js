class NobelPrizeWorldMap {
    constructor(_config, _commonData, _nobelPrizeData) {
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

        vis.updateVis()
    }

    updateVis() {
        let vis = this

        let winnersCountByCountryExtent = [0, 20, 40, 60, 80, 100, 120, 140, 160]
        vis.colorScale.domain(winnersCountByCountryExtent)

        vis.legendStops = [{color: vis.colorScale.range[0], value: winnersCountByCountryExtent[0], offset: 0},
            {color: vis.colorScale.range[9], value: winnersCountByCountryExtent[winnersCountByCountryExtent.length - 1],
                offset: 100}]
        // console.log('Colour 1: ', vis.legendStops[0].color, " Value 1: ", vis.legendStops[0].value)
        // console.log('Colour 2: ', vis.legendStops[1].color, " Value 2: ", vis.legendStops[1].value)

        vis.renderVis()
        vis.renderLegend()
    }

    renderVis() {
        let vis = this

        // Convert TopoJson -> GeoJson.
        const countries = topojson.feature(vis.commonData, vis.commonData.objects.countries)

        // Need count of winners per country when binding to determine colour saturation.
        const countWinnerByCountryData = d3.rollups(vis.nobelPrizeData, v => v.length, d => d.birth_countryNow)
        // console.log('Count winners by country data: ', countWinnerByCountryData)

        // Scale projection so geometry fits in svg area.
        vis.projection.fitSize([vis.width, vis.height], countries)
        
        // Show tooltip.
        let mouseOverCountry = function(event, d) {

        }

        // Hide tooltip.
        let mouseLeaveCountry = function(event, d) {

        }

        // Click on country once.
        let mouseClickCountry = function(event, d) {

        }

        // Click on country twice.
        let mouseDoubleClickCountry = function(event, d) {

        }

        const countryPath = vis.map.selectAll('.country')
            .data(countries.features)
            .join('path')
            .attr('class', 'country')
            .attr('d', vis.geoPath)
            .attr('stroke', 'black')
            .attr('fill', d => {
                if (d.properties.winnerCount) {
                    return vis.colorScale(d.properties.winnerCount)
                } else {
                    return 'white'
                }
            })
            .on('mouseover', mouseOverCountry)
            .on('mouseleave', mouseLeaveCountry)
            .on('click', mouseClickCountry)
            .on('dblclick', mouseDoubleClickCountry)
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