class InnovativeMap {
    constructor(_config, _commonData, _nobelPrizeData, _usCitiesData, _dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            dropdownMenu: _config.dropdownMenu,
            containerWidth: _config.containerWidth,
            containerHeight: _config.containerHeight,
            margin: { top: 35, right: 10, bottom: 10, left: 35 },
            tooltipPadding: 10,
            legendMarginTop: 375,
            legendMarginLeft: 35,
            legendRadius: 8
        }

        this.commonData = _commonData
        this.nobelPrizeData = _nobelPrizeData
        this.usCitiesData = _usCitiesData
        this.dispatcher = _dispatcher
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

        vis.cityMap = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`)

        // Initialize projection and path generator.
        vis.projection = d3.geoAlbers()
            .scale(600)
            .translate([vis.width / 2 + 100, vis.height / 2 + 75])
        vis.geoPath = d3.geoPath().projection(vis.projection)

        // Add dropdown menu skeleton.
        vis.dropdownMenu = d3.select(vis.config.dropdownMenu)

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        vis.countryFeatures = vis.country.features.filter(d => d.properties.name === 'United States of America')
        vis.usNobelPrizeData = d3.groups(vis.nobelPrizeData, d => d.birth_countryNow === 'United States of America')
        vis.bounds = vis.geoPath.bounds(vis.countryFeatures[0])

        // Combine data from us-cities.csv and laureates.csv.
        vis.validCities = []
        for (let i = 0; i < vis.usNobelPrizeData[1][1].length; i++) {
            let nobelItem = vis.usNobelPrizeData[1][1][i]
            for (let j = 0; j < vis.usCitiesData.length; j++) {
                let cityItem = vis.usCitiesData[j]
                if (cityItem.city === nobelItem.birth_cityNow.substring(0, nobelItem.birth_cityNow.indexOf(','))) {
                    vis.validCities.push(cityItem)
                }
            }
        }

        // Data for dropdown menu; only want unique items so use set.
        vis.dropdownItems = new Set(vis.validCities.map(d => d.city))
      
        vis.renderVis()
    }

    renderVis() {
        let vis = this

        vis.cityMap.selectAll('path')
            .data(vis.countryFeatures)
            .join('path')
            .attr('class', 'country')
            .attr('d', vis.geoPath)
            .attr('fill', 'lightyellow')
            .attr('stroke', 'black')
            .attr('stroke-width', 1)

        // Plot the cities as points.
        let cityPlots = vis.cityMap.selectAll('.city')
            .data(vis.validCities)
            .join('circle')
            .attr('class', 'city ')
            .attr('transform', d => `translate(${vis.projection([d.lon, d.lat])})`)
            .attr('r', 4)
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
            .attr('fill', 'white')
            .on('mouseover', function(event, d) {
                let highlightedCity = d.city
                d3.selectAll('.city')
                    .style('opacity', 0.5);

                d3.select('#inno-city-tooltip')
                    .style('display', 'block')
                    .style('background', 'white')
                    .style('border', 'solid')
                    .style('border-radius', '5px')
                    .style('padding', vis.config.tooltipPadding)
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(`<div><b>${highlightedCity + ', ' + d.state}</b></div>`)

                d3.select(this)
                    .style('opacity', 1)
                    .style('stroke-width', 2)
                    .style('fill', 'red')

                vis.dispatcher.call('highlightWinners', event, highlightedCity)
            })
            .on('mouseleave', function (d) {
                d3.selectAll('.city')
                    .style('opacity', 1)
                    .style('stroke-width', 1)
                    .style('fill', 'white')

                d3.select('#inno-city-tooltip')
                    .style('display', 'none');
            })
            .on('click', function (event) {
                const isActive = d3.select(this).classed('active')
                d3.select(this).classed('active', !isActive)

                let selectedCities = vis.cityMap.selectAll('.city.active').data().map(d => d.city)
                d3.select(this).style('fill', 'green')

                if (!d3.select(this).classed('active')) {
                    d3.select(this)
                        .style('fill', 'lightgray')
                } else {
                    d3.select(this)
                        .style('fill', 'gold')
                }

                // Interact with individual winners view.
                vis.dispatcher.call('filterCities', event, selectedCities)
            })

        // For highlighting city when dropdown item changed.
        let dropdownCity = vis.cityMap.append('g')

        // Create dropdown menu.
        d3.select('#dropdown-menu')
            .selectAll('.cities')
            .data(vis.dropdownItems)
            .join('option')
            .text(d => d)
            .attr('value', d => d)

        // Does not work with reference to menu, so keep active d3.select() instead.
        d3.select('#dropdown-menu')
            .on('change', function () {
                let selectedCity = d3.select(this).property('value')

                // Find city from dataset.
                let cityEntry = vis.validCities.filter(function (d) {
                    return d.city === selectedCity
                })

                d3.selectAll('.city')
                    .style('opacity', 0.5);

                // Highlight city on map.
                let highlightedCity = dropdownCity.selectAll('.specific-city')
                    .data(cityEntry)
                    .join('circle')
                    .attr('class', 'specific-city')
                    .attr('transform', d => `translate(${vis.projection([d.lon, d.lat])})`)
                    .attr('r', 4)
                    .attr('stroke', 'black')
                    .attr('stroke-width', 2)
                    .attr('fill', 'red')

                // Return highlighted city to default state.
                highlightedCity.transition().duration(2000)
                    .style('opacity', 1)
                    .style('stroke', 'black')
                    .style('stroke-width', 1)
                    .style('fill', 'white')
            })
    }
}