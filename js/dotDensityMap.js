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
            legendWidth: 150,
            legendHeight: 20
        }

        this.commonData = _commonData;
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
            .text('Winners in [Country Name]');

        vis.ddMap = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

        // Initialize projection and path generator.
        vis.projection = d3.geoAlbers()    // Easiest to point at small countries with cursor.
            .center([2, 47])
            .scale([vis.width / (2 * Math.PI)])
            .translate([vis.width / 2, vis.height / 2])
        vis.geoPath = d3.geoPath().projection(vis.projection);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.renderVis();
        vis.renderLegend();
    }

    renderVis() {
        let vis = this;

        // Convert TopoJson -> GeoJson.
        const country = topojson.feature(vis.commonData, vis.commonData.objects.countries);
        country.features = country.features.filter(d => d.properties.name === 'Canada')    // Replace 'Canada' with selected country.
        console.log(country.features)
        vis.projection.fitSize([vis.width, vis.height], country);

        let countryPath = vis.ddMap.selectAll('path')
            .data(country.features)
            .join('path')
            .attr('class', 'country')
            .attr('d', vis.geoPath)
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
    }

    renderLegend() {
        let vis = this;


    }
}