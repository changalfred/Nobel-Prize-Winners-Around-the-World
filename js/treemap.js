class Treemap {
    constructor(_config, _dispatcher, _data) {
        // Configuration object with defaults
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 800,
            margin: _config.margin || { top: 10, right: 10, bottom: 10, left: 10 },
        }
        this.dispatcher = _dispatcher;
        this.data = _data;
        this.initVis();
    }

    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.colorScale = d3.scaleOrdinal()
            .range(["white", "green"]) // light green to dark green
            .domain([0, 50]);

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // SVG Group containing the actual chart; D3 margin convention
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        var temp1 = d3.rollup(vis.data, v => v.length, d => d.affiliation_1[0]);
        const temp2 = new Map([...temp1.entries()].sort((a, b) => b[1] - a[1]));
        temp2.delete('');

        const awardsPerAffiliation = Array.from(temp2, function (item) {
            return { university: item[0], parent: 'origin', awardCount: item[1] }
        });
        var awardsPerAffiliationTopTen = awardsPerAffiliation.slice(0, 10);
        awardsPerAffiliationTopTen.push({ university: 'origin', parent: '', awardCount: '' });

        console.log(awardsPerAffiliation);

        // data processing:
        vis.data = d3.stratify()
            .id((d) => { return d.university; })
            .parentId(d => { return d.parent })
            (awardsPerAffiliationTopTen);
        vis.data.sum(d => { return d.awardCount })
    }

    updateVis() {
        // Prepare data and scales
        let vis = this;

        d3.treemap()
            .size([vis.width, vis.height])
            .padding(4)
            (vis.data);

        vis.renderVis();

        console.log(vis.data.leaves());
    }

    renderVis() {
        // Bind data to visual elements, update axes
        let vis = this;

        // Add rectangles
        const bars = vis.chart.selectAll('rect')
            .data(vis.data.leaves())
            .join('rect')
            .attr('x', function (d) { return d.x0; })
            .attr('y', function (d) { return d.y0; })
            .attr('width', function (d) { return d.x1 - d.x0; })
            .attr('height', function (d) { return d.y1 - d.y0; })
            .style("stroke", "black")
            .style("fill", "grey");

        const labels = vis.chart.selectAll('text')
            .data(vis.data.leaves())
            .join('text')
            .attr("x", function (d) { return d.x0 + 10 })    // +10 to adjust position (more right)
            .attr("y", function (d) { return d.y0 + 20 })    // +20 to adjust position (lower)
            .text(function (d) { return d.data.university })
            .attr("font-size", "15px")
            .attr("fill", "white")
    }
}
