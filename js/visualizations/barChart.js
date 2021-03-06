class BarChart {
    constructor(_config, _data, _dispatcher) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 650,
            containerHeight: 350,
            margin: {top: 15, right: 15, bottom: 70, left: 120}
        }
        this.data = _data;
        this.dispatcher = _dispatcher
        this.initVis();
    }

    initVis() {
        // Create SVG area, initialize scales and axes
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.categoryColours = ["#4e79a7", "#f28e2c", "#e15759", "#76b7b2", "#59a14f", "#edc949"]
        vis.prizeCategories = ["Peace", "Physics", "Economic Sciences", "Physiology or Medicine",
            "Chemistry", "Literature"]

        // Define Scales
        vis.xScale = d3.scaleLinear()
            .domain([0, d3.max(vis.data, d => d.prizeAmount)])
            .range([0, vis.width - 50]);

        vis.yScale = d3.scaleBand()
            .domain(vis.prizeCategories)
            .range([0, vis.height])
            .paddingInner(0.15);

        vis.colourScale = d3.scaleOrdinal()
            .range(vis.categoryColours)
            .domain(vis.prizeCategories)

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale)
            .tickSizeOuter(0)
            .tickFormat(d3.format("$.1s"));

        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(5)
            .tickSizeOuter(0);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chartArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`)
            .attr('class', 'chart-area');

        vis.chart = vis.chartArea.append('g');

        vis.xAxisG = vis.chartArea.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${vis.height})`);

        // Append y-axis group
        vis.yAxisG = vis.chartArea.append('g')
            .attr('class', 'axis y-axis');

        // Append axis titles.
        vis.svg.append("text")
            .attr("id", "total-prize-label")
            .attr("text-anchor", "middle")
            .attr("x", vis.config.containerWidth / 2 + 25)
            .attr("y", vis.config.containerHeight - 20)
            .text("Total Prize Money (USD)");

        vis.updateVis(vis.data);
    }

    updateVis() {
        let vis = this;


        vis.prizeAmountPerCategory = d3.rollup(vis.data, v => d3.mean(v, d => d.prizeAmountAdjusted), d => d.category);
        vis.xScale.domain([0, 10000000]);

        vis.xValue = d => d[1];
        vis.yValue = d => d[0];

        vis.renderVis();
    }

    renderVis() {
        // Bind data to visual elements, update axes
        let vis = this;

        let bars = vis.chart.selectAll('.bar')
            .data(vis.prizeAmountPerCategory, d => vis.yValue(d))
            .join('rect')
            .attr('class', 'bar')
            .attr('x', 0)
            .attr('y', d => vis.yScale(vis.yValue(d)))
            .attr('width', d => vis.xScale(vis.xValue(d)))
            .attr('height', vis.yScale.bandwidth())
            .attr('fill', d => vis.colourScale(d[0]));

        bars.on('mouseover', function (event, d) {
            let colourFill = darkenFill(d[0])

            d3.select(this)
                .style('fill', colourFill)
        })

        bars.on('mouseleave', function (event, d) {
            const category = d[0]

            let colourFill = resetFill(category)

            if (!d3.select(this).classed('active')) {
                d3.select(this)
                    .style('fill', colourFill)
            }
        })

        bars.on('click', function (event, d) {
            const isActive = d3.select(this).classed('active')
            d3.select(this).classed('active', !isActive)

            const selectedCategories = vis.chart.selectAll('.bar.active').data().map(d => d[0])
            d3.select(this).style('stroke', 'black').style('stroke-width', 2).style('fill', darkenFill(d[0]))

            if (!d3.select(this).classed('active')) {
                d3.select(this)
                    .style('fill', resetFill(d[0]))
                    .style('stroke', 'none')
            }

            vis.dispatcher.call('filterCategories', event, selectedCategories)
        })

        // Update the axes because the underlying scales might have changed
        vis.xAxisG.call(vis.xAxis).call((g) => g.select(".domain").remove());
        vis.yAxisG.call(vis.yAxis).call((g) => g.select(".domain").remove());
    }
}

function darkenFill(category, step) {
    let colourFill

    // Darken when cursor touches bar.
    if (category === 'Peace') {
        colourFill = d3.rgb(d3.schemeTableau10[0]).darker(step)
    } else if (category === 'Physics') {
        colourFill = d3.rgb(d3.schemeTableau10[1]).darker(step)
    } else if (category === 'Economic Sciences') {
        colourFill = d3.rgb(d3.schemeTableau10[2]).darker(step)
    } else if (category === 'Physiology or Medicine') {
        colourFill = d3.rgb(d3.schemeTableau10[3]).darker(step)
    } else if (category === 'Chemistry') {
        colourFill = d3.rgb(d3.schemeTableau10[4]).darker(step)
    } else {
        // Category is literature.
        colourFill = d3.rgb(d3.schemeTableau10[5]).darker(step)
    }
    return colourFill
}

function resetFill(category) {
    let colourFill

    // Reset to default colours when cursor leaves bar.
    if (category === 'Peace') {
        colourFill = d3.schemeTableau10[0]
    } else if (category === 'Physics') {
        colourFill = d3.schemeTableau10[1]
    } else if (category === 'Economic Sciences') {
        colourFill = d3.schemeTableau10[2]
    } else if (category === 'Physiology or Medicine') {
        colourFill = d3.schemeTableau10[3]
    } else if (category === 'Chemistry') {
        colourFill = d3.schemeTableau10[4]
    } else {
        // Category is literature.
        colourFill = d3.schemeTableau10[5]
    }

    return colourFill
}