class StackedAreaChart {

    // constructor method to initialize StackedAreaChart object
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        console.log('solar new', this.data);
        this.displayData = [];
        this.selectedStates = []; 
        this.colors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a']
        this.selectedCategory = 'evCount';
        this.initVis();
    
        //let colors = ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a'];
    
        // grab all the keys from the key value pairs in data (filter out 'year' ) to get a list of categories
        //this.dataCategories = Object.keys(this.data[0]).filter(d=>d !== "Year")
    
        // prepare colors for range
        //let colorArray = this.dataCategories.map( (d,i) => {
           // return colors[i%10]
        //})
        // Set ordinal color scale
        //this.colorScale = d3.scaleOrdinal()
            //.domain(this.dataCategories)
            //.range(colorArray);
    }
    
    
        /*
         * Method that initializes the visualization (static content, e.g. SVG area or axes)
         */
        initVis(){
                let vis = this;
            
                const parseTime = d3.timeParse("%b %Y");
            
                // Loop through your data and parse the "Date" column
                vis.data.forEach((d) => {
                    d.Date = parseTime(d.Date);
                    d.Count = +d.Count;
                });
            
                console.log('date', vis.data);
            
                vis.margin = {top: 20, right: 50, bottom: 20, left: 50};
            vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
            vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

            
                // Scales and axes
                vis.x = d3.scaleTime()
                    .range([0, vis.width])
                    .domain(d3.extent(vis.data, d => d.Date));
            
                vis.y = d3.scaleLinear()
                    .range([vis.height, 0]);
            
                vis.xAxis = d3.axisBottom()
                    .scale(vis.x);
            
                vis.yAxis = d3.axisLeft()
                    .scale(vis.y);
            
                // SVG drawing area
                vis.svg = d3.select("#" + vis.parentElement).append("svg")
                    .attr("width", vis.width + vis.margin.left + vis.margin.right)
                    .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
                    .append("g")
                    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");
            
                vis.svg.append("g")
                    .attr("class", "x-axis axis")
                    .attr("transform", "translate(0," + vis.height + ")");
            
                vis.svg.append("g")
                    .attr("class", "y-axis axis");
            
                // TO-DO: (Filter, aggregate, modify data)
                vis.wrangleData();
            }
    
        /*
         * Data wrangling
         */
        wrangleData(){
            let vis = this;

            vis.stateAbbreviations = vis.selectedStates.map(state => nameConverter.getAbbreviation(state));

           console.log('state abbr', vis.stateAbbreviations);

           vis.solarFiltered = vis.data.filter(d => {
            return vis.stateAbbreviations.includes(d.State);
          });

          console.log('selected states stack', vis.solarFiltered)

          //vis.dataCategories = Object.keys(vis.solarFiltered[0]).filter(d => d = "State")
          //console.log('categories', vis.dataCategories);
            
            //vis.displayData = vis.stackedData;

            vis.sumstat = d3.group(vis.solarFiltered, d => d.Date);
    

            // Update the visualization
            vis.updateVis();
        }
    
        /*
         * The drawing function - should use the D3 update sequence (enter, update, exit)
         * Function parameters only needed if different kinds of updates are needed
         */
        updateVis(){

            let vis = this;

            if(vis.selectedCategory === 'solarCount'){

            /*vis.x = d3.scaleLinear()
                .domain(d3.extent(vis.solarFiltered, function(d) { return d.Date; }))
                .range([ 0, vis.width ]);
            vis.svg.append("g")
                .attr("transform", `translate(0, ${vis.height})`)
                vis.svg.select(".x-axis").call(d3.axisBottom(vis.x));

            // Add Y axis
            vis.y = d3.scaleLinear()
                .range([vis.height, 0 ]);
            vis.svg.append("g")
                vis.svg.select(".y-axis").call(d3.axisLeft(vis.y)); */

            //vis.stackedData = d3.stack()
                //.keys(vis.stateAbbreviations)(vis.sumstat);
               

            //let stack = d3.stack()
                //.keys(vis.stateAbbreviations);


        // Convert the Map to an array of objects
            let dataArray = Array.from(vis.sumstat, ([key, value]) => ({ Date: key, ...Object.fromEntries(value.map(d => [d.State, d.Count])) }));

            vis.x = d3.scaleTime()
                .range([0, vis.width])
                .domain(d3.extent(dataArray, d => d.Date));

            vis.svg.select(".x-axis").call(vis.xAxis); 

        // Use d3.stack() on the array of objects
            vis.stackedData = d3.stack()
                .keys(vis.stateAbbreviations)
                .value((d, key) => d[key])
                (dataArray);

            // ... (rest o

            let colorArray = vis.stateAbbreviations.map( (d,i) => {
                return vis.colors[i%10]
            })

            //vis.stackedData = stack(vis.solarFiltered);
            //vis.stackedData = stack(vis.solarFiltered);
            
            //d3.stack().keys(vis.stateAbbreviations)(vis.solarFiltered);
            console.log('stacked data', vis.stackedData);

            vis.colorScale = d3.scaleOrdinal()
                .domain(vis.stackedData.keys())
                .range(colorArray);

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

           vis.y.domain([0, d3.max(vis.stackedData, d => d3.max(d, e => e[1]))]);

            vis.svg.select(".y-axis").call(vis.yAxis);

            /*vis.svg
                .selectAll("mylayers")
                .data(vis.stackedData)
                .join("path")
                .style("fill", function(d) { return vis.colorScale(d.key); })
                .attr("d", d3.area()
                    .x(function(d, i) { return vis.x(d.data.Date); })
                    .y0(function(d) { return vis.y(d[0]); })
                    .y1(function(d) { return vis.y(d[1]); })
                ) */

                
                
                //, function(d) {
                //return d3.max(d, function(e) {
                //return e[1];
                //});
                //})
                //]);
                 
            // Draw the layers
            let categories = vis.svg.selectAll(".area")
                .data(vis.stackedData);
                 
            categories.enter().append("path")
                .attr("class", "area")
                .merge(categories)
                .style("fill", d => vis.colorScale(d.key))
                .attr("d", d => vis.area(d))
                
            categories.exit().remove();

                // Call axis functions with the new domain
        }
     else {
        vis.svg.selectAll(".area").remove();
        vis.svg.select('.x-axis').selectAll("*").remove();
        // Remove y-axis
        vis.svg.select('.y-axis').selectAll("*").remove();
    }

    }
}