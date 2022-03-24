class BarChart {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: 1000,
            containerHeight: 800,
            margin: { top: 15, right: 15, bottom: 20, left: 120 }
        }
        this.data = _data;
        this.initVis();
    }

    initVis() {
        // Create SVG area, initialize scales and axes
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define Scales
        vis.xScale = d3.scaleLinear()
            .domain([0, d3.max(vis.data, d => d.prizeAmount)])
            .range([0, vis.width]);

        vis.yScale = d3.scaleBand()
            .domain(["Peace", "Physics", "Economic Sciences", "Physiology or Medicine", "Chemistry", "Literature"])
            .range([0, vis.height])
            .paddingInner(0.15);

        // Initialize axes
        vis.xAxis = d3.axisBottom(vis.xScale).tickSizeOuter(0);

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
            .attr('class', 'chart_area');

        vis.chart = vis.chartArea.append('g');

        vis.xAxisG = vis.chartArea.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${vis.height})`);

        // Append y-axis group 
        vis.yAxisG = vis.chartArea.append('g')
            .attr('class', 'axis y-axis');

        vis.updateVis(vis.data);
    }

    updateVis() {
        let vis = this;

        vis.prizeAmountPerCategory = d3.rollup(vis.data, v => d3.mean(v, d => d.prizeAmountAdjusted), d => d.category);
        vis.xScale.domain([0, d3.max(vis.prizeAmountPerCategory.values()) + 1e6]);

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
            .attr('x', d => 0)
            .attr('y', d => vis.yScale(vis.yValue(d)))
            .attr('width', d => vis.xScale(vis.xValue(d)))
            .attr('height', d => vis.yScale.bandwidth())
            .attr('fill', 'green');

        // Update the axes because the underlying scales might have changed
        vis.xAxisG.call(vis.xAxis).call((g) => g.select(".domain").remove());
        vis.yAxisG.call(vis.yAxis).call((g) => g.select(".domain").remove());
    }

}