/* * * * * * * * * * * * * *
*        InnovVis         *
* * * * * * * * * * * * * */

class InnovVis {

    constructor(parentElement, waterData) {
        this.parentElement = parentElement;
        this.waterData = waterData; 
        this.selectedCategory = 'evCount'; 
        this.state = ''; 


        this.categoryLabels = {
            "AQ-Wtotl": "Aquaculture",
            "LI-WFrTo": "Livestock", 
            "IR-CUsFr": "Irrigation",
            "PT-CUTot": "Public Supply",
            "IN-Wtotl": "Industrial",
            "MI-Wtotl": "Mining"
        };

        this.initVis();
    }


    initVis() {
        let vis = this;

        vis.margin = {top: 50, right: 50, bottom: 50, left: 50};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr("id", 'dropVis')
            .append('g')
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);
        
        vis.infoText = vis.svg.append("text")
            .attr("class", "info-text")
            .attr("x", vis.width / 2)
            .attr("y", 0) 
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .style("font-size", "40px"); 
        console.log("hello?? We are in innovVis")

        vis.wrangleData();
    }

   
    wrangleData() {
        let vis = this;
        if(vis.state) {
            vis.state = nameConverter.getAbbreviation(vis.state); 
            console.log("Flag from innov", vis.state); 
    
            let stateData = vis.waterData.find(d => d.State === vis.state);
    
            let properties = ["AQ-Wtotl", "LI-WFrTo", "IR-CUsFr", "PT-CUTot", "IN-Wtotl", "MI-Wtotl"]; 
    
            vis.displayData = properties.map(property => {
                return {
                    category: property,
                    value: stateData[property]
                };
            });
    
            vis.updateVis();
        }
      

    
        
    
    }

    updateVis() {
        let vis = this; 
       
           
                // Defines the scales for the raindrops
                let radiusScale = d3.scaleSqrt()
                    .domain([0, d3.max(vis.displayData, d => d.value)])
                    .range([50, 100]);


                let customInterpolator = d3.interpolateRgb("lightblue", "darkblue");
                let colorScale = d3.scaleSequential((d) => customInterpolator(d))
                    .domain(d3.extent(vis.displayData, d => d.value));

                let fontSizeScale = d3.scaleSqrt()
                    .domain([0, d3.max(vis.displayData, d => d.value)])
                    .range([10, 20]);


                function raindropPath(d) {

                    let scaledRadius = radiusScale(d.value);


                    let originalWidth = 243.44676 * 2;
                    let originalHeight = 343.23508 * 2;
                    let aspectRatio = originalWidth / originalHeight;

                    let newHeight = scaledRadius * 2;
                    let newWidth = newHeight * aspectRatio;

                    let scaleX = newWidth / originalWidth;
                    let scaleY = newHeight / originalHeight;

                    let scaledDropPath = `M ${243.44676 * scaleX},${222.01677 * scaleY} C ${243.44676 * scaleX},${288.9638 * scaleY} ${189.17548 * scaleX},${343.23508 * scaleY} ${122.22845 * scaleX},${343.23508 * scaleY} C ${55.281426 * scaleX},${343.23508 * scaleY} ${1.0101458 * scaleX},${288.9638 * scaleY} ${1.0101458 * scaleX},${222.01677 * scaleY} C ${1.0101458 * scaleX},${155.06975 * scaleY} ${40.150976 * scaleX},${142.95572 * scaleY} ${122.22845 * scaleX},${0.79337431 * scaleY} C ${203.60619 * scaleX},${141.74374 * scaleY} ${243.44676 * scaleX},${155.06975 * scaleY} ${243.44676 * scaleX},${222.01677 * scaleY} z`;

                    return scaledDropPath;
                }

                // Defines a force simulation for the drops
                let simulation = d3.forceSimulation(vis.displayData)
                    .force("x", d3.forceX(vis.width / 2.5).strength(0.1))
                    .force("y", d3.forceY(vis.height / 3).strength(0.1))
                    .force("collide", d3.forceCollide(d => radiusScale(d.value) + 1))
                    .force('charge', d3.forceManyBody().strength(20))
                    .on("tick", ticked);


                function ticked() {

                    vis.displayData.forEach(d => {
                        d.x = Math.max(radiusScale(d.value), Math.min(vis.width - radiusScale(d.value), d.x));
                        d.y = Math.max(radiusScale(d.value), Math.min(vis.height - radiusScale(d.value), d.y));
                    });


                    vis.svg.selectAll(".raindrop")
                        .data(vis.displayData)
                        .join("path")
                        .attr("class", "raindrop")
                        .attr("d", d => raindropPath(d))
                        .attr("transform", d => `translate(${d.x},${d.y})`)
                        .attr("stroke", "black")
                        .attr("stroke-width", "2px")
                        .attr("fill", d => colorScale(d.value))
                        .on('mouseover', function (event, d) {
                            d3.selectAll('.raindrop').classed('dimmed', true);
                            d3.select(this).classed('dimmed', false);
                            vis.infoText.text(`${d3.format(".2s")(d.value)} MGal/Day`);
                        })
                        .on('mouseout', function () {
                            d3.selectAll('.raindrop').classed('dimmed', false);
                            vis.infoText.text('');
                        });

                    vis.svg.selectAll(".category-text")
                        .data(vis.displayData)
                        .join("text")
                        .attr('font-size', '25px')
                        .attr("class", "category-text")
                        .attr("x", d => d.x + radiusScale(d.value) / 3 + 2)
                        .attr("y", d => d.y + radiusScale(d.value) + 20)
                        .style("text-anchor", "middle")
                        .style("alignment-baseline", "middle")
                        .style("fill", "black")
                        .text(d => vis.categoryLabels[d.category] || d.category);

                    vis.svg.selectAll(".value-text")
                        .data(vis.displayData)
                        .join("text")
                        .attr("class", "value-text")
                        .attr("x", d => d.x + radiusScale(d.value) / 2.75)
                        .attr("y", d => d.y + radiusScale(d.value) - 20)
                        .style("text-anchor", "middle")
                        .style("alignment-baseline", "middle")
                        .style("dominant-baseline", "central")
                        .style("fill", "white")
                        .style("font-size", "10px")
                        .style("font-size", d => `${fontSizeScale(radiusScale(d.value))}px`)
                        .text(d => d3.format(".2s")(d.value));



                }

                // Start the simulation
                simulation.alpha(1).restart();


    }

}
