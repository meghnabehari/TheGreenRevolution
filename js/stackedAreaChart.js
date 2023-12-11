// Defines instance of stacked area chart which has a layer for each state and displays solar generation per year. 
class StackedAreaChart {

    // Constructor for the StackedAreaChart class
    constructor(parentElement, data) {
        // Initialize instance variables with provided parameters
        this.parentElement = parentElement;
        this.data = data;
        console.log('solar new', this.data);
        this.displayData = [];
        this.selectedStates = [];
        this.colors = ['#FFFFFF', '#143109', '#EFEFEF', '#AAAE7F', '#5F4554', '#D0D6B3', '#87924F', '#3B2B34', '#8F8F8F', '#555D32', '#9E788F', '#44313C', '#484B30', '#525252', '#303220']
        this.selectedCategory = 'evCount';
        this.initVis();
    }

    // Initialization method for setting up the visualization
    initVis() {
        let vis = this;

        // Parse time and data
        const parseTime = d3.timeParse("%b %Y");

        // Loop through the data and parse the "Date" column
        vis.data.forEach((d) => {
            d.Date = parseTime(d.Date);
            d.Count = +d.Count;
        });

        console.log('date', vis.data);

        // Set margins and dimensions based on the parent element's size
        vis.margin = { top: 20, right: 20, bottom: 40, left: 80 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Create scales and axes
        vis.x = d3.scaleTime()
            .range([0, vis.width])
            .domain(d3.extent(vis.data, d => d.Date));

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        // Create SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Append x-axis and y-axis groups
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // Create a tooltip element
        vis.tooltip = d3.select("#" + vis.parentElement)
            .append("div")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px");

        // Call the data wrangling method
        vis.wrangleData();
    }

    /*
     * Data wrangling
     */
    wrangleData() {
        let vis = this;

        // Map selected states to their abbreviations
        vis.stateAbbreviations = vis.selectedStates.map(state => nameConverter.getAbbreviation(state));

        console.log('state abbr', vis.stateAbbreviations);

        // Filter data based on selected states
        vis.solarFiltered = vis.data.filter(d => {
            return vis.stateAbbreviations.includes(d.State);
        });

        console.log('selected states stack', vis.solarFiltered)

        // Group data by date
        vis.sumstat = d3.group(vis.solarFiltered, d => d.Date);

        // Update the visualization
        vis.updateVis();
    }

    // Update method for refreshing the visualization based on user interactions
    updateVis() {
        let vis = this;

        // Check if the selected category is 'solarCount'
        if (vis.selectedCategory === 'solarCount') {

            if (vis.selectedStates.length === 0) {
                // If no states are selected, hide or remove the rectangles and axes
                vis.svg.selectAll(".heatmap-rect").remove();
                vis.svg.select('.x-axis').style('display', 'none');
                vis.svg.select('.y-axis').style('display', 'none');
                vis.svg.selectAll('.axis-label').style('display', 'none');
                return; // Exit the function
            }

            // Convert the Map to an array of objects
            let dataArray = Array.from(vis.sumstat, ([key, value]) => ({ Date: key, ...Object.fromEntries(value.map(d => [d.State, d.Count])) }));

            // Update x-scale
            vis.x = d3.scaleTime()
                .range([0, vis.width])
                .domain(d3.extent(dataArray, d => d.Date));

            // Update x-axis
            vis.svg.select(".x-axis").call(vis.xAxis);

            // Use d3.stack() on the array of objects
            vis.stackedData = d3.stack()
                .keys(vis.stateAbbreviations)
                .value((d, key) => d[key])
                (dataArray);

            // Create an array of colors for each state
            let colorArray = vis.stateAbbreviations.map((d, i) => {
                return vis.colors[i % 10]
            })

            console.log('stacked data', vis.stackedData);

            // Create a color scale
            vis.colorScale = d3.scaleOrdinal()
                .domain(vis.stackedData.keys())
                .range(colorArray);

            // Define area function
            vis.area = d3.area()
                .curve(d3.curveCardinal)
                .x(function (d) {
                    return vis.x(d.data.Date);
                })
                .y0(function (d) {
                    return vis.y(d[0]);
                })
                .y1(function (d) {
                    return vis.y(d[1]);
                });

            // Update y-scale
            vis.y.domain([0, d3.max(vis.stackedData, d => d3.max(d, e => e[1]))]);

            // Update y-axis
            vis.svg.select(".y-axis").call(vis.yAxis);

            // Append the y-axis label
            vis.svg.append("text")
                .attr("class", "axis-label")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - vis.margin.left)
                .attr("x", 0 - (vis.height / 2))
                .attr("dy", "2em")
                .style("text-anchor", "middle")
                .text("Solar Generation (thousand MWh)");

            // Append the x-axis label
            vis.svg.append("text")
                .attr("class", "axis-label")
                .attr("transform", "translate(" + (vis.width / 2) + " ," + (vis.height + vis.margin.top) + ")")
                .style("text-anchor", "middle")
                .attr("dx", "-0.3em")
                .attr("dy", "0.8em")
                .text("Year");

            // Draw the layers
            let categories = vis.svg.selectAll(".area")
                .data(vis.stackedData);

            // Enter, update, and exit selections for areas
            categories.enter().append("path")
                .attr("class", "area")
                .merge(categories)
                .style("fill", d => vis.colorScale(d.key))
                .attr("d", d => vis.area(d))
                .on("mouseover", function (event, d) {
                    console.log('state', d.key)
                    // Show tooltip on mouseover
                    vis.tooltip.transition()
                        .duration(200)
                        .style("opacity", 0.9);
                    vis.tooltip.html("State: " + d.key); 

                    vis.tooltip.style.left = `${event.pageX - svgRect.left}px`; 
                    vis.tooltip.style.top = `${event.pageY - svgRect.top}px`;
                })
                .on("mouseout", function () {
                    // Hide tooltip on mouseout
                    vis.tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });

            // Remove areas that are no longer needed
            categories.exit().remove();
        } else {
            // If the category is not 'solarCount', hide or remove the areas and axes
            vis.svg.selectAll(".area").remove();
            vis.svg.select('.x-axis').selectAll("*").remove();
            vis.svg.select('.y-axis').selectAll("*").remove();
            vis.svg.selectAll('.axis-label').remove();
        }
    }
}
