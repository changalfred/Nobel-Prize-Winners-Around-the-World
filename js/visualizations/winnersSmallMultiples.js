class WinnersSmallMultiples {
    constructor(_config, _nobelPrizeData, _usCitiesData, _highlightedCityData, _dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth,
            containerHeight: _config.containerHeight,
            margin: { top: 35, right: 10, bottom: 10, left: 35 },
            tooltipPadding: 10,
            legendMarginTop: 375,
            legendMarginLeft: 35,
            legendRadius: 4
        }

        this.nobelPrizeData = _nobelPrizeData
        this.usCitiesData = _usCitiesData
        this.highlightedCityData = _highlightedCityData
        this.dispatcher = _dispatcher
        this.initVis()
    };

    initVis() {
        let vis = this

        vis.viewWidth = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right
        vis.viewHeight = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom

        // SVG
        vis.svg = d3.select(vis.config.parentElement)
            .append('svg')
            .attr('id', 'individual-winners-view')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .attr('transform', `translate(${vis.config.containerWidth / 2}, -25)`)

        // Title
        vis.svg.append('text')
            .attr('class', 'individual-winners title')
            .attr('x', vis.viewWidth / 2 - 115)
            .attr('y', vis.config.margin.top - 15)
            .text('Gender of Individual Winners in US')

        // Create view area.
        vis.view = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left / 2 + 5}, ${vis.config.margin.top + 10})`)
            .attr('border', '2px solid black')

        // // Attach g for legend.
        vis.legendGroup = vis.svg.append('g')
            .attr('width', 100)
            .attr('height', 75)
            .attr('transform', `translate(${vis.viewWidth - 60}, 45)`)

        vis.updateVis()
    }

    updateVis() {
        let vis = this

        // Only keep USA winners.
        vis.usNobelPrizeData = nobelPrizeData.filter(d => d.birth_countryNow === 'United States of America')

        // Create 2D array: rows of winners where number of winners per row is as equal as possible.
        vis.matrixWinnersData = []
            // Make 2D array with 9 rows.
        for (let i = 0; i < 9; i++) {
            vis.matrixWinnersData[i] = []
        }

        let count = 0 // Track item count in US winners data.
            // Insert item into each row.
        for (let i = 0; i < 9; i++) {
            let matrix = vis.matrixWinnersData[i]
                // 25 items per row.
            for (let j = 0; j < 25; j++) {
                if (count === 223) { // US winners data has 223 items.
                    break
                }
                matrix.push(vis.usNobelPrizeData[count])
                count++
            }
        }

        // Group winners into birth cities. TODO: Needed?
        vis.winnersByCity = d3.groups(vis.usNobelPrizeData, d => d.birth_cityNow)

        vis.renderVis()
        vis.renderLegend()
    }

    renderVis() {
        let vis = this

        let row = vis.view.selectAll('.row')
            .data(vis.matrixWinnersData)
            .join('g')
            .attr('class', '.row')
            .attr('x', 0)
            .attr('y', (d, i) => i * 10)
            .each(function(d, i) {
                d3.select(this)
                    .selectAll('.row')
                    .data(d)
                    .join('circle')
                    .attr('class', d => `mark winner ${d.birth_cityNow}`)
                    .attr('cx', function(d, j) {
                        return j * 15
                    })
                    .attr('cy', function() {
                        return i * 12
                    })
                    .attr('r', 4)
                    .attr('fill', d => d.gender === 'male' ? 'blue' : 'pink')
                    .on('mouseover', function(event, d) {
                        // Highlight all winners born in same city (also want to highlight city later).
                        let highlightedWinners = []
                        for (let i = 0; i < vis.winnersByCity.length; i++) {
                            if (vis.winnersByCity[i][0] === d.birth_cityNow) {
                                highlightedWinners.push(vis.winnersByCity[i])
                            }
                        }

                        // Tooltip for highlighted winner.
                        d3.select('#individual-winners-tooltip')
                            .style('display', 'block')
                            .style('background', 'white')
                            .style('border', 'solid')
                            .style('border-radius', '5px')
                            .style('padding', vis.config.tooltipPadding)
                            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                            .html(`<div><b>${d.fullName}</b></div>`)

                        let className = d3.select(this)._groups[0]
                        d3.selectAll(className)
                            .style('fill', 'gold')
                            .style('r', 5)
                            .style('stroke', 'black')
                            .style('stroke-width', 1)

                        // TODO: Uncomment and show.
                        // d3.selectAll(`.winner-${d.birth_cityNow}`)
                        //     .style('fill', 'gold')
                        //     .style('r', 5)
                        //     .style('stroke', 'black')
                        //     .style('stroke-width', 1)

                        // vis.dispatcher.call('highlightCity', event, highlightedWinners)
                    })
                    .on('mouseleave', function(event, d) {
                        d3.select('#individual-winners-tooltip')
                            .style('display', 'none');

                        let className = d3.select(this)._groups[0]
                        d3.selectAll(className)
                            .style('fill', d => d.gender === 'male' ? 'blue' : 'pink')
                            .style('r', 4)
                            .style('stroke', 'none')
                            .style('stroke-width', 0)
                    })
                    .on('click', function(event, d) {


                        let selectedWinners = []

                        // vis.dispatcher.call('filterWinners', event, selectedWinners)
                    })
            })

        // Highlight winners based on selected city.
        row.selectAll('.select-city winners')
            .data(vis.highlightedCityData)
            .join('circle')
            .attr('class', 'select-city winners')
            .attr('fill', 'gold')
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
    }

    renderLegend() {
        let vis = this

        const keys = ['male', 'female']

        let legendBins = vis.legendGroup.selectAll('.legend-bin')
            .data(keys)

        legendBins.join('circle')
            .attr('class', d => `legend-mark gender-${d}`)
            .attr('cx', 25)
            .attr('cy', (d, i) => i * 25)
            .attr('r', vis.config.legendRadius)
            .attr('fill', d => d === 'male' ? 'blue' : 'pink')

        legendBins.join('text')
            .attr('class', d => `legend-label gender-${d}`)
            .attr('x', 35)
            .attr('y', (d, i) => i * 25 + 4)
            .text(d => d)
    }
}