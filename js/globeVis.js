/* * * * * * * * * * * * * *
*          GlobeVis        *
* * * * * * * * * * * * * */
/* 
 CLASS TO RENDER A GLOBE VISUALIZATION
*/

class GlobeVis {

    constructor(parentElement, countryData, geoData, countryNames) {
        this.parentElement = parentElement;
        this.geoData = geoData;

        this.countryData = countryData;
        this.countryNames = countryNames;


        this.initVis()
    }

       /**
     * Initializes the visualization by setting up the SVG container and projection for the globe.
     */
    initVis() {
        let vis = this;


        //INIT DRAWING AREA
        vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);


        // Projection
        vis.projection = d3.geoOrthographic()
            .translate([vis.width / 2, vis.height / 2]);

        vis.path = d3.geoPath()
            .projection(vis.projection);

        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features;



        vis.svg.append("path")
            .datum({ type: "Sphere" })
            .attr("class", "graticule")
            .attr('fill', '#aec6f5')
            .attr("stroke", "black")
            .attr("d", vis.path);

        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter().append("path")
            .attr('fill', 'black')
            .attr('stroke', 'black')
            .attr('stroke-width', '0.25px')
            .attr('class', 'country')
            .attr("d", vis.path);

        let zoom = vis.height / 600;


        vis.projection = d3.geoOrthographic()
            .scale(249.5 * zoom)
            .translate([vis.width / 2, vis.height / 2]);


        vis.wrangleData()

    }

    /**
     * Data wrangling method to process and prepare data for visualization.
     * This includes setting up a color scale and mapping country names to data.
     */
    wrangleData() {
        let vis = this;

        vis.nameByID = {};
        vis.countryNames.forEach(d => {
            vis.nameByID[d.id] = d.name;
        });

        d3.csv("../data/countries_emissions_ids.csv").then(data => {
            let valuesById = {};
            data.forEach(d => {
                valuesById[d.country_id] = +d.value;
            });

            let minValue = d3.min(data, d => +d.value);
            let maxValue = d3.max(data, d => +d.value);

            vis.colorScale = d3.scaleLinear()
                .domain([minValue, maxValue])
                .range(['#D0D6B3', '#143109']);


            vis.countryInfo = {};

            let missingData = [];

            vis.geoData.objects.countries.geometries.forEach(d => {


                let value = valuesById[d.id];
                if (value === undefined) {
                    missingData.push(d.id);
                }
                let color;
                if (value) {
                    color = vis.colorScale(value);
                } else {
                    color = vis.colorScale(minValue);
                }
                vis.countryInfo[d.properties.name] = {
                    name: d.properties.name,
                    category: 'category_' + 1,
                    color: color,
                    value: value || 1000
                }
            });


            vis.updateVis();


        });
    }


 /**
     * Update the visualization with new data.
     * This method is responsible for updating the
     * **/
    updateVis() {
        let vis = this;
        let m0,
            o0;

        vis.countries.attr('fill', d => {
            if (vis.countryInfo[d.properties.name]) {
                return vis.countryInfo[d.properties.name].color;
            } else {
                return 'lightgray';
            }
        });

        // TOOLTIP STUFF
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .style("opacity", 0)
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('color', 'black');
        vis.countries
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .attr('stroke-width', '1px')
                    .attr('stroke', 'black');

                let countryName = vis.nameByID[d.id] || 'No data';
                let emissionValue = vis.countryInfo[d.properties.name] ? vis.countryInfo[d.properties.name].value : '';
                let emissionText = emissionValue === 1000 ? '<1000' : emissionValue;


                let boundingBox = vis.svg.node().getBoundingClientRect();
                let marginAboveGlobe = 5;
                let topPosition = boundingBox.bottom - marginAboveGlobe;


                vis.tooltip
                    .transition()
                    .duration(200)
                    .style('opacity', 0.9);
                vis.tooltip
                    .html(`${countryName}: ${emissionText} Gt`)
                    .style('left', `${vis.width / 1.78}px`)
                    .style('top', `${topPosition}px`)
                    .style('transform', 'translateX(-50%)')
                    .style('color', 'white')
                    .style('font-size', '40px')
                    .style('text-align', 'center')
                    .transition()
                    .duration(200)
                    .style('opacity', 0.9);
            })
            .on('mouseout', function () {
                d3.select(this)
                    .attr('stroke', 'black')
                    .attr('stroke-width', '0.25px')

                vis.tooltip
                    .transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        vis.svg.call(
            d3.drag()
                .on("start", function (event) {

                    let lastRotationParams = vis.projection.rotate();
                    m0 = [event.x, event.y];
                    o0 = [-lastRotationParams[0], -lastRotationParams[1]];
                })
                .on("drag", function (event) {
                    if (m0) {
                        let m1 = [event.x, event.y],
                            o1 = [o0[0] + (m0[0] - m1[0]) / 4, o0[1] + (m1[1] - m0[1]) / 4];
                        vis.projection.rotate([-o1[0], -o1[1]]);
                    }

                    // Update the map
                    vis.path = d3.geoPath().projection(vis.projection);
                    d3.selectAll(".country").attr("d", vis.path)
                    d3.selectAll(".graticule").attr("d", vis.path)
                })
        )


    }
}