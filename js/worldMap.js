class NobelPrizeWorldMap {
    constructor(_config, _data) {
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

        this.data = _data
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
        vis.projection = d3.geoMercator()
        vis.geoPath = d3.geoPath().projection(vis.projection)

        vis.colorScale = d3.scaleLinear()
            .range(['white', 'darkgreen'])

        vis.updateVis()
    }

    updateVis() {
        let vis = this
        let rollupByBirthCountryData = d3.rollups(vis.data, v => v.length, d => d.birth_countryNow)

        // console.log('vis data: ', vis.data)
        // console.log('rollup by birth country: ', rollupByBirthCountryData)

        const winnersDensityExtent = d3.extent(vis.data,
            d3.rollups(vis.data, v => v.length, d => d.birth_countryNow))
        // console.log('Winners density extent: ', winnersDensityExtent)

        vis.colorScale.domain(winnersDensityExtent)

        vis.renderVis()
        vis.renderLegend()
    }

    renderVis() {
        let vis = this

        // Convert TopoJson -> GeoJson.
        const countries = topojson.feature(vis.data, vis.data.objects.collection)

        // Need count of winners per country when binding to determine colour saturation.
        const countWinnerByCountryData = d3.rollups(vis.data, v => v.length, d => d.birth_countryNow)
        // console.log('Count winners by country data: ', countWinnerByCountryData)

        // Scale projection so geometry fits in svg area.
        vis.projection.fitSize([vis.width, vis.height], countries)

        const countryPath = vis.map.selectAll('.country')
            .data(countries.features)
            .join('path')
            .attr('class', 'country')
            .attr('d', vis.geoPath)
            .attr('fill', () => {
                return vis.colorScale(countWinnerByCountryData)
            })
    }

    renderLegend() {
        let vis = this
    }
}