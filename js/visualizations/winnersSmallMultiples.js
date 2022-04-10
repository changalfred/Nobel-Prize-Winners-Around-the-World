class WinnersSmallMultiples {
    constructor(_config, _nobelPrizeData, _usCitiesData) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth,
            containerHeight: _config.containerHeight,
            margin: {top: 35, right: 10, bottom: 10, left: 35},
            tooltipPadding: 10,
            legendMarginTop: 375,
            legendMarginLeft: 35,
            legendRadius: 4
        }

        this.nobelPrizeData = _nobelPrizeData
        this.usCitiesData = _usCitiesData
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
            .attr('transform', `translate(450, -800)`)

        // Title
        vis.svg.append('text')
            .attr('class', 'individual-winners title')
            .attr('x', vis.viewWidth / 2 - 45)
            .attr('y', vis.config.margin.top - 15)
            .text('Individual Winners')

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

        let count = 0   // Track item count in US winners data.
        // Insert item into each row.
        for (let i = 0; i < 9; i++) {
            let matrix = vis.matrixWinnersData[i]
            // 25 items per row.
            for (let j = 0; j < 25; j++) {
                if (count === 223) {    // US winners data has 223 items.
                    break
                }
                matrix.push(vis.usNobelPrizeData[count])
                count++
            }
        }

        // Group winners into birth cities.
        vis.winnersByCity = d3.groups(vis.usNobelPrizeData, d => d.birth_cityNow)   // Needed?

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
            .each(function (d, i) {
                d3.select(this)
                    .selectAll('.row')
                    .data(d)
                    .join('circle')
                    .attr('cx', function (d, j) {
                        return j * 15
                    })
                    .attr('cy', function () {
                        return i * 10
                    })
                    .attr('r', 4)
                    .attr('fill', d => d.gender === 'male' ? 'blue' : 'pink')
                    .on('mouseover', function (event, d) {
                        d3.select('#individual-winners-tooltip')
                            .style('display', 'block')
                            .style('background', 'white')
                            .style('border', 'solid')
                            .style('border-radius', '5px')
                            .style('padding', vis.config.tooltipPadding)
                            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                            .html(`<div><b>${d.fullName}</b></div>`)
                    })
                    .on('mouseleave', function (event, d) {
                        d3.select('#individual-winners-tooltip')
                            .style('display', 'none');
                    })
                    .on('click', function (event, d) {

                    })
            })
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