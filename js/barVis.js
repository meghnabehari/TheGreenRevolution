/* * * * * * * * * * * * * *
*      class BarVis        *
* * * * * * * * * * * * * */


class BarVis {

    constructor(parentElement, evData, solarData, waterData) {
        this.parentElement = parentElement;
        console.log(this.parentElement)
        this.evData = evData;
        this.waterData = waterData;
        this.solarData = solarData;
        this.selectedStates = [];
        this.selectedCategory = 'waterUsage'
        this.initVis();

        
    }

    initVis(){

        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 80};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
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
            .selectAll('text') // Select all text elements within the x-axis
            .style('text-anchor', 'end') // Align text at the end
            .attr('transform', 'rotate(-45)'); // Rotate the text by -45 degrees;

        vis.svg.append('g')
            .attr('class', 'y-axis')
            .call(vis.yAxis);

        // Append x-axis and y-axis labels
        vis.svg.append('text')
            .attr('class', 'x-axis-label')
            .attr('transform', `translate(${vis.width / 2}, ${vis.height + 40})`)
            .style('text-anchor', 'middle')
            .text('State'); // X-axis label

        vis.svg.append('text')
            .attr('class', 'y-axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('y', -60)
            .attr('x', -vis.height / 2)
            .style('text-anchor', 'middle')
            .text('Registration Count'); // Y-axis label     

        this.wrangleData();
    }

    wrangleData(){
        let vis = this;

        let stateAbbreviations = vis.selectedStates.map(state => nameConverter.getAbbreviation(state));
        //console.log("states in wrangle", selectedStates)


        vis.evDataFiltered = vis.evData.filter(d => {
            return stateAbbreviations.includes(d.State);
          });

        vis.waterDataFiltered = vis.waterData.filter(d => {
            return stateAbbreviations.includes(d.State);
          });  

        vis.solarDataFiltered = vis.solarData.filter(d => {
            return stateAbbreviations.includes(d.State);
          });  
        
        // prepare ev data by de-stringing Registration_Count
        vis.evDataFiltered.forEach(d => {
            d.RegistrationCount = +d.RegistrationCount; // convert to number
        });

         // prepare water data by grouping all rows by state
         vis.waterDataFiltered = Array.from(d3.group(vis.waterDataFiltered, d => d.State), ([key, value]) => ({key, value}))

         // init final data structure in which both data sets will be merged into
         vis.stateInfo = []
 
         //merge
         vis.waterDataFiltered.forEach(State => {
 
             // get full state name
             let stateName = nameConverter.getFullName(State.key)
 
             // init counters
             let evCount = 0;
             let solarCount = 0;
             let waterUsage = 0;
 
             // look up registration count for the state in the ev data set
             vis.evDataFiltered.forEach(row => {
                 if (row.State === State.key) {
                     evCount += +row['RegistrationCount'];
                 }
             })

             // look up solar count for the state in the solar data set
             vis.solarDataFiltered.forEach(row => {
                 if (row.State === State.key) {
                     solarCount += +row['solar'];
                 }
             })

             // look up water withdrawals for the state in the water data set
             State.value.forEach(entry => {
                 waterUsage += +entry['TotalGroundwaterWithdrawals'];
             });
 
             // populate the final data structure
             vis.stateInfo.push(
                 {
                     State: stateName,
                     evCount: evCount,
                     waterUsage: waterUsage,
                     solarCount: solarCount,
                 }
             )
 
         })

        vis.updateVis()

    }

    updateVis() {
        let vis = this;
    
        // Sort the stateInfo array based on the selected category in descending order
        vis.stateInfo.sort((a, b) => b[vis.selectedCategory] - a[vis.selectedCategory]);
    
        // Set up scales and axes using the sorted data
        const stateNames = vis.stateInfo.map(d => d.State);
        vis.xScale.domain(stateNames);
    
        // Determine the number of bars and calculate the bar width dynamically
        const numBars = vis.stateInfo.length;
        const maxBarWidth = vis.xScale.bandwidth(); // Maximum available bar width
    
        // Set a maximum width for the bars to ensure they don't get too wide
        const maxWidthForBars = 200; // Adjust as needed
    
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
    
        vis.yScale.domain([0, d3.max(vis.stateInfo, d => d[vis.selectedCategory])]);
    
        // Update the x-axis and y-axis based on the new domains
        vis.svg.select('.x-axis').call(vis.xAxis);
        vis.svg.select('.y-axis').call(vis.yAxis);
    
        // Determine the y-axis title based on the selectedCategory
        let yAxisTitle;
        if (vis.selectedCategory === 'evCount') {
            yAxisTitle = 'EV Registration Count';
        } else if (vis.selectedCategory === 'solarCount') {
            yAxisTitle = 'Solar Count (Thousand Megawatthours)';
        } else if (vis.selectedCategory === 'waterUsage') {
            yAxisTitle = 'Water Usage (Mgal/d)';
        } else {
            yAxisTitle = ''; // Handle other categories as needed
        }
    
        // Update the y-axis label based on the selectedCategory
        vis.svg.select('.y-axis-label')
            .text(yAxisTitle);
    
        // add title
        vis.svg.select('.title.bar-title').select('text')
            .text("Electric Vehicle Registration Count By State")
            .attr('transform', `translate(${vis.width / 2}, 10)`)
            .attr('text-anchor', 'middle');
    
        const bars = vis.svg.selectAll('.bar')
            .data(vis.stateInfo);
    
        bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('fill', '#143109')
            .merge(bars)
            .attr('x', d => vis.xScale(d.State) + xOffset) // Add xOffset for centering
            .attr('y', d => vis.yScale(d[vis.selectedCategory]))
            .attr('width', barWidth) // Use the dynamically determined bar width
            .attr('height', d => vis.height - vis.yScale(d[vis.selectedCategory]));
    
        bars.exit().remove();
    }
    
    
    
    


}
