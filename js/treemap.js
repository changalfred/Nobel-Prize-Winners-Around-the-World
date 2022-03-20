class Treemap {
    constructor(_config, _dispatcher, _data) {
        // Configuration object with defaults
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 800,
            tooltipPadding: _config.tooltipPadding || 15,
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
        const fontSize = 15;

        function wrapText(selection) {
            selection.each(function () {
                const node = d3.select(this);
                const rectWidth = +node.attr('data-width');
                let word;
                const words = node.text().split(' ').reverse();
                let line = [];
                const x = node.attr('x');
                const y = node.attr('y');
                let tspan = node.text('').append('tspan').attr('x', x).attr('y', y);
                let lineNumber = 0;
                while (words.length > 1) {
                    word = words.pop();
                    line.push(word);
                    tspan.text(line.join(' '));
                    const tspanLength = tspan.node().getComputedTextLength();
                    if (tspanLength > rectWidth && line.length !== 1) {
                        line.pop();
                        tspan.text(line.join(' '));
                        line = [word];
                        tspan = addTspan(word);
                    }
                }

                addTspan(words.pop());

                function addTspan(text) {
                    lineNumber += 1;
                    return (
                        node
                            .append('tspan')
                            .attr('x', x)
                            .attr('y', y)
                            .attr('dy', `${lineNumber * fontSize}px`)
                            .text(text)
                    );
                }
            });
        }

        // Add rectangles
        const rect = vis.chart.selectAll('rect')
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
            .attr('data-width', (d) => d.x1 - d.x0)
            .attr("x", function (d) { return d.x0 + 10 })    // +10 to adjust position (more right)
            .attr("y", function (d) { return d.y0 + 20 })    // +20 to adjust position (lower)
            .text(function (d) { return d.data.university })
            .attr('font-size', `${fontSize}px`)
            .attr("fill", "white")
            .call(wrapText);

        rect.on('mousemove', (event, d) => {
            d3.select('#treemapTooltip')
                .style('display', 'block')
                .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                .html(`
                <div class="treemapTooltip-title">${d.data.university}</div>
                <div><i>Number of Nobel Laureates: ${d.data.awardCount}</i></div>
              `);
        })
            .on('mouseout', () => {
                d3.select('#treemapTooltip').style('display', 'none');
            });
    }
}
