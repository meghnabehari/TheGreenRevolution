class Heatmap {

    constructor(parentElement, heatmapData) {

        this.parentElement = parentElement;
        this.heatmapData = heatmapData;
        this.selectedCategory = 'evCount';
        this.selectedStates = []

        this.initVis()
    }

    initVis() {
        let vis = this;

        console.log(vis.heatmapData);

        // Increase the bottom margin to leave space for x-axis labels
        vis.margin = {top: 20, right: 20, bottom: 20, left: 100};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        vis.myGroups = Array.from(new Set(vis.heatmapData.map(d => d.Region)))
        console.log(vis.myGroups);
        vis.myVars = Array.from(new Set(vis.heatmapData.map(d => d.Year)))
        console.log(vis.myVars);

        // Build X scales and axis:
        vis.xScale = d3.scaleBand()
            .range([0, vis.width])
            .padding(0.02)
            .domain(vis.myGroups);

        vis.yScale = d3.scaleBand()
            .range([vis.height, 0])
            .domain(vis.myVars)
            .padding(0.02);

        vis.myColor = d3.scaleSequential()
            .interpolator(d3.interpolatePurples)
            .domain([1, 150000])

        vis.tooltip = d3.select("#my_dataviz")
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px");


        //vis.svg.select(".y-axis").call(vis.yAxis);
        //vis.svg.select(".x-axis").call(vis.xAxis);

        vis.chart = vis.svg.append("g")
            .attr("class", "squares");

        vis.wrangleData();
        
    }

    wrangleData() {
        let vis = this;

        const converter = new StateToRegionConverter();
        console.log("selectedStates", vis.selectedStates)

        vis.selectedRegions = vis.selectedStates.map(state => converter.getRegion(state));
        console.log("selectedRegions", vis.selectedRegions)

        console.log("heatmapData", vis.heatmapData)

        vis.heatmapDataFiltered = vis.heatmapData.filter(d => {
            return vis.selectedRegions.includes(d.Region);
          });

         console.log("heatmapDataFiltered", vis.heatmapDataFiltered) 

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        if(vis.selectedCategory === 'solarCount'){

            vis.yAxis = d3.axisLeft()
            .scale(vis.yScale);

        vis.xAxis = d3.axisBottom()
            .scale(vis.xScale)
            .ticks(4);

        // Append the y-axis group
        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .call((vis.yAxis).tickSize(0));

        // Append the x-axis group and position it at the bottom
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call((vis.xAxis).tickSize(0))
            .selectAll('text') // Select all text elements within the x-axis
            .style('text-anchor', 'end') // Align text at the end
            .attr('transform', 'rotate(-45)'); // Rotate the text by -45 degrees;

            
            vis.svg.select('.x-axis').call(vis.xAxis);
            vis.svg.select('.y-axis').call(vis.yAxis);
    
            // Use selectAll to select existing rectangles, and then join the data
            const rects = vis.chart
                .selectAll(".heatmap-rect")
                .data(vis.heatmapDataFiltered, function (d) { return d['Region'] + ':' + d['Year']; });
    
            // Update existing rectangles
            rects
                .attr("x", function (d) { return vis.xScale(d['Region']); })
                .attr("y", function (d) { return vis.yScale(d['Year']); })
                .attr("width", vis.xScale.bandwidth())
                .attr("height", vis.yScale.bandwidth())
                .style("fill", function (d) { return vis.myColor(d['Generation']); })
                .on('mouseover', function (event, d) {
                    vis.tooltip
                        .style("opacity", 1)
                        .html("The exact value of<br>this cell is: " + d.Generation)
                        .style("left", (event.x) / 2 + "px")
                        .style("top", (event.y) / 2 + "px");
                })
                .on('mouseout', function () {
                    // reset tooltip on mouseout
                    vis.tooltip.style("opacity", 0);
                });
    
            // Enter new rectangles
            rects.enter()
                .append("rect")
                .attr("class", "heatmap-rect")
                .attr("x", function (d) { return vis.xScale(d['Region']); })
                .attr("y", function (d) { return vis.yScale(d['Year']); })
                .attr("width", vis.xScale.bandwidth())
                .attr("height", vis.yScale.bandwidth())
                .style("fill", function (d) { return vis.myColor(d['Generation']); })
                .on('mouseover', function (event, d) {
                    vis.tooltip
                        .style("opacity", 1)
                        .html("Net Generation:<br> " + d.Generation + " thousand MWh")
                        .style("left", (event.x) / 2 + "px")
                        .style("top", (event.y) / 2 - 100 + "px");
                })
                .on('mouseout', function () {
                    // reset tooltip on mouseout
                    vis.tooltip.style("opacity", 0);
                });
    
            // Remove rectangles that are no longer needed
            rects.exit().remove();
        }

        else {
            // If the category is not 'solarCount', hide or remove the heatmap rectangles
            vis.chart.selectAll(".heatmap-rect").remove();
            vis.svg.select('.x-axis').remove();
            vis.svg.select('.y-axis').remove();
        }
    

        }

    }