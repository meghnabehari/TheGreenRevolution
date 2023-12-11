/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */


class MapVis {

    constructor(parentElement, geoData, evData, solarData, waterData){
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.evData = evData;
        this.waterData = waterData;
        this.solarData = solarData;
        this.colorRange = ["#143109", "#1C450D"];
        this.selectedCategory = 'evCount';
        this.selectedStates = [];
        this.initVis();

    }


    initVis() {
        let vis = this;

        vis.margin = { top: 20, right: 20, bottom: 20, left: 20};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.viewpoint = {'width': 1000, 'height': 750};
        vis.zoom = vis.width / vis.viewpoint.width;
        
        // init drawing area
        vis.svg = d3.select(`#${vis.parentElement}`)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr("viewBox", `0 0 ${vis.viewpoint.width} ${vis.viewpoint.height}`)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        // define geo generator
        vis.path = d3.geoPath()

        // convert TopoJSON data into GeoJSON data structure
        vis.US = topojson.feature(vis.geoData, vis.geoData.objects.states).features

        // draw states
        vis.states = vis.svg.selectAll(".state")
            .data(vis.US)
            .enter().append("path")
            .attr("d", vis.path);

        // append title
        vis.svg.append('text')
            .attr('class', 'title')
            .attr('transform', `translate(${vis.width / 2 + 140}, 25)`)
            .attr('text-anchor', 'middle')
            .style('font-size', '28px');


        // append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .style("opacity", 0);

        vis.wrangleData();

    }

    wrangleData() {

        let vis = this;

        // prepare ev data by de-stringing Registration_Count
        vis.evData.forEach(d => {
            d.RegistrationCount = +d.RegistrationCount; // convert to number
        });

        // prepare water data by grouping all rows by state
        vis.waterData = Array.from(d3.group(vis.waterData, d => d.State), ([key, value]) => ({key, value}))

        // init final data structure in which both data sets will be merged into
        vis.stateInfo = []

        //merge
        vis.waterData.forEach(State => {

            // get full state name
            let stateName = nameConverter.getFullName(State.key)

            // init counters
            let evCount = 0;
            let solarCount = 0;
            let waterUsage = 0;

            // look up population for the state in the census data set
            vis.evData.forEach(row => {
                if (row.State === State.key) {
                    evCount += +row['RegistrationCount'];
                }
            })

            vis.solarData.forEach(row => {
                if (row.State === State.key) {
                    solarCount += +row['solar'];
                }
            })

            // calculate new cases by summing up all the entries for each state
            State.value.forEach(entry => {
                waterUsage += +entry['TotalGroundwaterWithdrawals'];
            });

            if (stateName === 'Alabama') {
                solarCount = 0;
            }

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

        console.log("stateInfo", vis.stateInfo)

        vis.updateVis();
}

    updateVis() {
        let vis = this;

        vis.colorScale = d3.scaleSequential()
            .domain(d3.extent(vis.stateInfo, d => d[vis.selectedCategory])) 
            .interpolator(t => d3.interpolateRgb("#A1B690", "#1C450D")(t));
            
        let legendRectWidth = 300;
        let legendRectHeight= 20;

        // append legend
        vis.svg.append("defs")
            .append("linearGradient")
            .attr("id", "legend-gradient")
            .selectAll("stop")
            .data(vis.colorScale.ticks().map((tick, i, nodes) => ({ offset: `${100*i/nodes.length}%`, color: vis.colorScale(tick) })))
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        vis.svg.append("rect")
            .attr("x", vis.width - legendRectWidth - vis.margin.right)
            .attr("y", vis.height + 200)
            .attr("width", legendRectWidth)
            .attr("height", legendRectHeight)
            .style("fill", "url(#legend-gradient)");

        // Create a linear scale for the legend
        let legendScale = d3.scaleLinear()
            .domain(vis.colorScale.domain())
            .range([0, legendRectWidth]);

        vis.svg.select(".legend-axis").remove();

        // Create a legend axis group and position it
        vis.legendAxisGroup = vis.svg.append("g")
            .attr("class", "legend-axis")
            .attr("transform", `translate(${vis.width - legendRectWidth - vis.margin.right}, ${vis.height + 220})`);

        // Create axis
        let legendAxis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(d3.format(".1f"));

        // Call the legend axis inside the legend axis group
        vis.legendAxisGroup.call(legendAxis)

        // Select all states
        vis.states
        .data(topojson.feature(vis.geoData, vis.geoData.objects.states).features)
        .join("path")
            .attr("fill", d => {
                const stateData = vis.stateInfo.find(info => info.State === d.properties.name);
        d.originalFill = stateData ? vis.colorScale(stateData[vis.selectedCategory]) : "#ccc";
                return d.originalFill; })    
               

        .attr("stroke", "#143109")
        .attr("stroke-width", 1)
        .on('mouseover', function(event, d) {
            const stateDataMO = vis.stateInfo.find(info => info.State === d.properties.name);       
            vis.tooltip
                .style("opacity", 1)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY + 30) + "px");
        })
        .on('mouseout', function() {
            // reset tooltip on mouseout
            vis.tooltip.style("opacity", 0);
        })
        .on('click', function (event, d) {
            // Check if the state is already selected
            const isSelected = vis.selectedStates.includes(d.properties.name);
          
        
            if (isSelected) {
              // Deselect the state
              vis.selectedStates = vis.selectedStates.filter(state => state !== d.properties.name);
              d3.select(this).style('fill', d.originalFill); // Reset color
             
            } else {
              // Select the state
              vis.selectedStates.push(d.properties.name);
              d3.select(this).style('fill', '#9E788F'); // Change color
              
            }
            stateChange(vis.selectedStates);
            
        });

}

}


