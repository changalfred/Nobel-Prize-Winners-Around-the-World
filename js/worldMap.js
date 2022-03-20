class NobelPrizeWorldMap {
    constructor(_config, _commonData, _nobelPrizeData) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth,
            containerHeight: _config.containerHeight,
            margin: {top: 35, right: 10, bottom: 10, left: 35},
            tooltipPadding: 10,
            legendTop: 10,
            legendRight: 10,
            legendWidth: 10,
            legendHeight: 10
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
            // .range(['lightgreen', 'darkgreen'])
            .range(d3.schemeYlGn[9])

        vis.updateVis()
    }

    updateVis() {
        let vis = this

        // const arrWinnerCounts = []
        // const maxWinnersByCountry = d3.rollups(vis.nobelPrizeData, v => v.length, d => d.birth_countryNow)
        //
        // for (let i = 0; i < maxWinnersByCountry.length; i++) {
        //     arrWinnerCounts.push(maxWinnersByCountry[i][1])
        // }

        // Min winners excludes 0 because those countries will be coloured white, which is not part of colour scale.
        let winnersCountByCountryExtent = [0, 20, 40, 60, 80, 100, 120, 140, 160]
        vis.colorScale.domain(winnersCountByCountryExtent)

        vis.renderVis()
        vis.renderLegend()
    }

    renderVis() {
        let vis = this

        // Convert TopoJson -> GeoJson.
        const countries = topojson.feature(vis.commonData, vis.commonData.objects.countries)
        // console.log('Countries: ', countries)

        // Need count of winners per country when binding to determine colour saturation.
        const countWinnerByCountryData = d3.rollups(vis.nobelPrizeData, v => v.length, d => d.birth_countryNow)
        // console.log('Count winners by country data: ', countWinnerByCountryData)

        // Scale projection so geometry fits in svg area.
        vis.projection.fitSize([vis.width, vis.height], countries)

        const countryPath = vis.map.selectAll('.country')
            .data(countries.features)
            .join('path')
            .attr('class', 'country')
            .attr('d', vis.geoPath)
            .attr('stroke', 'black')
            .attr('fill', d => {
                if (d.properties.winnerCount) {
                    console.log('Colour from scale: ', vis.colorScale(d.properties.winnerCount))
                    return vis.colorScale(d.properties.winnerCount)
                } else {
                    return 'white'
                }
            })
    }

    renderLegend() {
        let vis = this
    }
}