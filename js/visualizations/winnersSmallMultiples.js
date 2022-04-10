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
            legendRadius: 8
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
            .attr('transform', `translate(450, -850)`)

        // Create view area.
        vis.view = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.right})`)
    }

    updateVis() {
        let vis = this

        console.log('Prize data: ', vis.nobelPrizeData)
        console.log('City data: ', vis.usCitiesData)
    }

    renderVis() {
        let vis = this
    }
}