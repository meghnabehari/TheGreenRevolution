/**
 * BarVis class represents a bar chart visualization for displaying data related to electric vehicle (EV) registration counts, solar generation, and water usage by state.
 * @class
 */
class BarVis {
    /**
     * Creates an instance of the BarVis class.
     * @constructor
     * @param {string} parentElement - The ID of the HTML element where the bar chart will be rendered.
     * @param {Array} evData - An array of data representing EV registration counts by state.
     * @param {Array} solarData - An array of data representing solar generation by state.
     * @param {Array} waterData - An array of data representing water usage by state.
     */
    constructor(parentElement, evData, solarData, waterData) {
        this.parentElement = parentElement; // ID of the parent HTML element
        this.evData = evData; // Array of EV registration count data
        this.waterData = waterData; // Array of water usage data
        this.solarData = solarData; // Array of solar generation data
        this.selectedStates = []; // Array to store selected states
        this.selectedCategory = 'evCount'; // Default selected category
        this.initVis(); // Initialize the visualization
    }

    /**
     * Initializes the visualization by setting up the SVG container, scales, axes, and labels.
     */
    initVis() {
        let vis = this;

        // Define margins and dimensions for the chart
        vis.margin = { top: 20, right: 20, bottom: 50, left: 80 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Create an SVG container for the chart
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        // Set up scales and axes
        vis.xScale = d3.scaleBand()
            .range([0, vis.width])
            .padding(0.1);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom(vis.xScale);
        vis.yAxis = d3.axisLeft(vis.yScale);

        // Append x-axis and y-axis to the SVG
        vis.svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${vis.height})`)
            .call(vis.xAxis)
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('transform', 'rotate(-45)');

        vis.svg.append('g')
            .attr('class', 'y-axis')
            .call(vis.yAxis);

        // Append x-axis and y-axis labels
        vis.svg.append('text')
            .attr('class', 'x-axis-label')
            .attr('transform', `translate(${vis.width / 2}, ${vis.height + 40})`)
            .style('text-anchor', 'middle')
            .style('font-size', '13px')
            .attr("dy", "0.75em")
            .text('State'); // X-axis label

        vis.svg.append('text')
            .attr('class', 'y-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', -60)
            .attr('x', -vis.height / 2)
            .style('text-anchor', 'middle')
            .text('Registration Count'); // Y-axis label

        // Append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .style("opacity", 0);

        // Load and prepare data
        this.wrangleData();
    }

    /**
     * Filters and prepares the data based on selected states.
     */
    wrangleData() {
        let vis = this;

        // Get state abbreviations for selected states
        let stateAbbreviations = vis.selectedStates.map(state => nameConverter.getAbbreviation(state));

        // Filter EV data by selected states
        vis.evDataFiltered = vis.evData.filter(d => {
            return stateAbbreviations.includes(d.State);
        });

        // Filter water data by selected states
        vis.waterDataFiltered = vis.waterData.filter(d => {
            return stateAbbreviations.includes(d.State);
        });

        // Filter solar data by selected states
        vis.solarDataFiltered = vis.solarData.filter(d => {
            return stateAbbreviations.includes(d.State);
        });

        // Convert RegistrationCount to numbers in EV data
        vis.evDataFiltered.forEach(d => {
            d.RegistrationCount = +d.RegistrationCount; // Convert to number
        });

        // Group water data by state
        vis.waterDataFiltered = Array.from(d3.group(vis.waterDataFiltered, d => d.State), ([key, value]) => ({ key, value }));

        // Initialize the final data structure to merge all datasets
        vis.stateInfo = [];

        // Merge data from different datasets for selected states
        vis.waterDataFiltered.forEach(State => {
            let stateName = nameConverter.getFullName(State.key); // Get full state name
            let evCount = 0;
            let solarCount = 0;
            let waterUsage = 0;

            // Look up registration count for the state in the EV dataset
            vis.evDataFiltered.forEach(row => {
                if (row.State === State.key) {
                    evCount += +row['RegistrationCount'];
                }
            });

            // Look up solar count for the state in the solar dataset
            vis.solarDataFiltered.forEach(row => {
                if (row.State === State.key) {
                    solarCount += +row['solar'];
                }
            });

            // Calculate total water usage for the state from the water dataset
            State.value.forEach(entry => {
                waterUsage += +entry['TotalGroundwaterWithdrawals'];
            });

            // Populate the final data structure
            vis.stateInfo.push(
                {
                    State: stateName,
                    evCount: evCount,
                    waterUsage: waterUsage,
                    solarCount: solarCount,
                }
            );
        });

        // Update the visualization
        vis.updateVis();
    }

    /**
 * Updates the visualization with filtered and prepared data.
 */
updateVis() {
    let vis = this;

    // Check if there are selected states to determine whether to display axes
    const showAxes = vis.selectedStates.length > 0;

    // Sort the stateInfo array based on the selected category in descending order
    vis.stateInfo.sort((a, b) => b[vis.selectedCategory] - a[vis.selectedCategory]);

    // Set up scales and axes using the sorted data
    const stateNames = vis.stateInfo.map(d => d.State);
    vis.xScale.domain(stateNames);

    // Determine the number of bars and calculate the bar width dynamically
    const numBars = vis.stateInfo.length;
    const maxBarWidth = vis.xScale.bandwidth(); // Maximum available bar width

    // Set a maximum width for the bars to ensure they don't get too wide
    const maxWidthForBars = 200;

    let barWidth;
    if (numBars <= 3) {
        // If there are 3 or fewer bars, set a fixed width
        barWidth = Math.min(maxBarWidth, maxWidthForBars);
    } else {
        // Calculate the width based on the available space
        barWidth = maxBarWidth;
    }

    // Calculate the offset to center the bars
    const xOffset = (maxBarWidth - barWidth) / 2;

    // Set the y-axis domain based on the selected category's maximum value
    vis.yScale.domain([0, d3.max(vis.stateInfo, d => d[vis.selectedCategory])]);

    // Select and update the x-axis, and optionally display or hide it
    const xAxis = vis.svg.select('.x-axis')
        .style('display', showAxes ? 'block' : 'none')
        .call(vis.xAxis);

    // Rotate x-axis labels for better readability
    xAxis.selectAll('text')
        .style('text-anchor', 'end')
        .attr('transform', 'rotate(-30)');

    // Select and update the y-axis, and optionally display or hide it
    vis.svg.select('.y-axis')
        .style('display', showAxes ? 'block' : 'none')
        .call(vis.yAxis);

    // Determine the y-axis title based on the selectedCategory
    let yAxisTitle;
    if (vis.selectedCategory === 'evCount') {
        yAxisTitle = 'EV Registration Count';
    } else if (vis.selectedCategory === 'solarCount') {
        yAxisTitle = 'Solar Generation (thousand MWh)';
    } else if (vis.selectedCategory === 'waterUsage') {
        yAxisTitle = 'Water Usage (Mgal/d)';
    } else {
        yAxisTitle = ''; // No title for other categories
    }

    // Update the y-axis label based on the selectedCategory
    vis.svg.select('.y-axis-label')
        .text(yAxisTitle)
        .style('display', showAxes ? 'block' : 'none');

    // Update the x-axis label visibility
    vis.svg.select('.x-axis-label')
        .style('display', showAxes ? 'block' : 'none');

    // Add a title to the chart
    vis.svg.select('.title.bar-title').select('text')
        .text("Electric Vehicle Registration Count By State")
        .attr('transform', `translate(${vis.width / 2}, 10)`)
        .attr('text-anchor', 'middle');

    // Select all the bars, bind data, and update their attributes
    const bars = vis.svg.selectAll('.bar')
        .data(vis.stateInfo);

    // Enter new bars and set their attributes
    bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('fill', '#143109')
        .merge(bars)
        .attr('x', d => vis.xScale(d.State) + xOffset) // Add xOffset for centering
        .attr('y', d => vis.yScale(d[vis.selectedCategory]))
        .attr('width', barWidth) // Use the dynamically determined bar width
        .attr('height', d => vis.height - vis.yScale(d[vis.selectedCategory]));

    // Remove any bars that are no longer needed
    bars.exit().remove();
}
    

    


}