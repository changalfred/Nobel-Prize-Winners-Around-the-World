class DotDensityMap {
    constructor(_config, _commonData, _nobelPrizeData) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth,
            containerHeight: _config.containerHeight,
            margin: {top: 35, right: 10, bottom: 10, left: 35},
            tooltipPadding: 10,
            legendMarginTop: 375,
            legendMarginLeft: 35,
            legendRadius: 8
        }

        this.commonData = _commonData
        this.nobelPrizeData = _nobelPrizeData
        this.initVis()
    };

    initVis() {
        let vis = this

        // Set margins.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom

        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)

        vis.svg.append('text')
            .attr('x', vis.config.containerWidth / 4)
            .attr('y', 20)
        // .text('Winners in [Country Name]')

        vis.ddMap = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`)

        // Initialize projection and path generator.
        vis.projection = d3.geoMercator()    // Easiest to point at small countries with cursor.
            // .center([2, 47])
            .scale(1)
            .translate([0, 0])
            .precision(0)
        vis.geoPath = d3.geoPath().projection(vis.projection)

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        vis.renderVis()
        vis.renderLegend()
    }

    renderVis() {
        let vis = this

        // Convert TopoJson -> GeoJson.
        const country = topojson.feature(vis.commonData, vis.commonData.objects.countries)
        country.features = country.features.filter(d => d.properties.name === 'Madagascar')    // Replace 'Canada' with selected country.
        // console.log(country.features[0])

        let bounds = vis.geoPath.bounds(country.features)
        let scale = 0.95 / Math.max((bounds[1][0] - bounds[0][0]) / vis.config.containerWidth,
            (bounds[1][1] - bounds[0][1]) / vis.config.containerHeight)
        let translate = [(vis.config.containerWidth - scale * (bounds[1][0] + bounds[0][0])) / 2,
            (vis.config.containerHeight - scale * (bounds[1][1] + bounds[0][1])) / 2]

        vis.projection = d3.geoMercator()
            .scale(scale)
            .translate(translate)
        const path = vis.geoPath.projection(vis.projection)
        console.log(vis.geoPath)
        vis.projection.fitSize([vis.width, vis.height], country) // TODO: Uncomment this and country renders.

        let countryPath = vis.ddMap.selectAll('path')
            .data(country.features)
            .join('path')
            .attr('class', 'country')
            .attr('d', path)
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
    }

    renderLegend() {
        let vis = this

        const keys = ['male', 'female']

        let legendBins = vis.ddMap.selectAll('.legend-bin')
            .data(keys)

        legendBins.join('circle')
            .attr('class', d => `legend-mark gender-${d}`)
            .attr('cx', 20)
            .attr('cy', (d, i) => i * 25)
            .attr('r', vis.config.legendRadius)
            .attr('fill', d => d === 'male' ? 'blue' : 'pink')

        legendBins.join('text')
            .attr('class', d => `legend-label gender-${d}`)
            .attr('x', 35)
            .attr('y', (d, i) => i * 25 + 4)
            .text(d => d)

        legendBins.on('hover', function () {

        })
    }
}