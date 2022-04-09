class InnovativeMap {
    constructor(_config, _commonData, _nobelPrizeData, _usCitiesData) {
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
        this.usCitiesData = _usCitiesData
        this.initVis()
    };

    initVis() {
        let vis = this

        // Convert TopoJson -> GeoJson.
        vis.country = topojson.feature(vis.commonData, vis.commonData.objects.countries)

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

        vis.ddMap = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`)

        // Initialize projection and path generator.
        vis.projection = d3.geoAlbers()
            // .center([500, 200])
            .scale(500)
            // .scale([vis.config.containerWidth / 2, vis.config.containerHeight / 2])
            .translate([vis.width / 2 + 50, vis.height / 2 + 75])
        vis.geoPath = d3.geoPath().projection(vis.projection)

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        vis.countryFeatures = vis.country.features.filter(d => d.properties.name === 'United States of America')    // Replace 'Canada' with selected country.
        vis.usNobelPrizeData = d3.groups(vis.nobelPrizeData, d => d.birth_countryNow === 'United States of America')
        vis.bounds = vis.geoPath.bounds(vis.countryFeatures[0])

        // Combine data from us-cities.csv and laureates.csv.
        // let matchCount = 0
        vis.winnersWithLatLon = []
        for (let i = 0; i < vis.usNobelPrizeData[1][1].length; i++) {
            let nobelItem = vis.usNobelPrizeData[1][1][i]
            for (let j = 0; j < vis.usCitiesData.length; j++) {
                let cityItem = vis.usCitiesData[j]
                if (cityItem.city === nobelItem.birth_cityNow.substring(0, nobelItem.birth_cityNow.indexOf(','))) {
                    nobelItem.lat = cityItem.lat
                    nobelItem.lon = cityItem.lon
                    vis.winnersWithLatLon.push(nobelItem)
                }
            }
        }
        // console.log('Nobel Item: ', vis.winnersWithLatLon)

        vis.renderVis()
        vis.renderLegend()
    }

    renderVis() {
        let vis = this

        // let scale = 0.95 / Math.max((vis.bounds[1][0] - vis.bounds[0][0]) / vis.config.containerWidth,
        //     (vis.bounds[1][1] - vis.bounds[0][1]) / vis.config.containerHeight)
        // let translate = [(vis.config.containerWidth - scale * (vis.bounds[1][0] + vis.bounds[0][0])) / 2,
        //     (vis.config.containerHeight - scale * (vis.bounds[1][1] + vis.bounds[0][1])) / 2]

        // vis.projection = d3.geoAlbers()
        //     // .center([500, 200])
        //     .scale(400)
        //     // .scale([vis.config.containerWidth / 2, vis.config.containerHeight / 2])
        //     .translate([vis.width / 2, vis.height / 2 + 75])
        // const path = vis.geoPath.projection(vis.projection)

        vis.ddMap.selectAll('path')
            .data(vis.countryFeatures)
            .join('path')
            .attr('class', 'country')
            .attr('d', vis.geoPath)
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('stroke-width', 1)

        // Plot the cities as points.
        vis.ddMap.selectAll('.point')
            .data(vis.usCitiesData)
            .join('circle')
            .attr('class', 'point')
            .attr('transform', function (d) {
                return `translate(${vis.projection([d.lon, d.lat])})`
            })
            // .attr('cx', function (d, i) {
            //     // console.log('Data: ', d)
            //     console.log('Lon: ', d)
            //     return d.lon + 500   // Longitude to determine x position.
            // })
            // .attr('cy', function (d, i) {
            //     // console.log('Data: ', d)
            //     console.log('Lat: ', d)
            //     return d.lat    // Latitude to determine y position.
            // })
            .attr('r', '3px')
            .attr('fill', 'green')

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