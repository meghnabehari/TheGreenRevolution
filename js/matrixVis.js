class DotMatrix {

    constructor(parentElement, data){
        this.parentElement = parentElement;
        this.data = data;
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = {top: 10, right: 10, bottom: 10, left: 10};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr('transform', `translate (${vis.margin.left}, ${vis.margin.top})`);

        vis.dotPadding = 0.2; // Space between dots

      
        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;
    
        vis.displayData = {};
    
        Object.keys(vis.data).forEach(category => {
            let total = vis.data[category].total;
    
            let baseDots = {
                "IrMic": 1,
                "IrSpr": 1,
                "IrSur": 1
            };
    
            let remainingDots = 32 - Object.keys(baseDots).length; 
            let remainingPercent = 1 - (Object.keys(baseDots).length / 32);
    
            Object.keys(vis.data[category]).forEach(subcategory => {
                if (subcategory !== 'total') {
                    let subcategoryPercent = vis.data[category][subcategory] / total;
                    let subcategoryDots = Math.round(subcategoryPercent / remainingPercent * remainingDots);
                    baseDots[subcategory] += subcategoryDots;
                }
            });
    
            let dotsArray = Object.values(baseDots);
            let dotsSum = dotsArray.reduce((a, b) => a + b, 0);
            while (dotsSum > 32) {
                let maxDots = Math.max(...dotsArray);
                let maxIndex = dotsArray.indexOf(maxDots);
                baseDots[Object.keys(baseDots)[maxIndex]]--;
                dotsSum--;
                dotsArray = Object.values(baseDots);
            }
    
            vis.displayData[category] = baseDots;
        });

        console.log(vis.displayData)
    
        vis.updateVis();
    }
    
    
    updateVis() {
        let vis = this;


        function updatePercentageText(selectedSubcategory, color) {
            const subcategoryText = {
                "IrMic": "micro",
                "IrSpr": "sprinkler",
                "IrSur": "gravity"
            };
            Object.keys(vis.displayData).forEach((category, categoryIndex) => {
                let totalDots = vis.displayData[category]["IrMic"] + vis.displayData[category]["IrSpr"] + vis.displayData[category]["IrSur"];
                let selectedDots = vis.displayData[category][selectedSubcategory];
                let selectedPercentage = Math.round((selectedDots / totalDots) * 100);
    
                d3.select(`#percentage-text-${category}`)
                    .text(`${selectedPercentage}%`) 
                    .style("fill", color);

                    const newText = `of ${subcategoryText[selectedSubcategory]} irrigation systems`;
                d3.select(`#description-text-${category}`)
                    .text(newText);
            });
        }
    
        vis.svg.selectAll("*").remove();


        // LEGEND STUFF
        const legendData = [
            { subcategory: "IrMic", color: "#6D7048", label: "Micro" },
            { subcategory: "IrSpr", color: "#143109", label: "Sprinkler" },
            { subcategory: "IrSur", color: "#9E788F", label: "Gravity" }
        ];
       
        const rectWidth = 120; 
        const rectHeight = 60; 
        const legendSpacing = 30; 
        const legendX = vis.width / 2 - (legendData.length * (rectHeight + legendSpacing)) / 2 - 60;
        const legendY = 20; 
    
        vis.subcategoryNameText = vis.svg.append("text")
        .attr("id", "subcategory-name-text")
        .attr("x", vis.width / 2)
        .attr("y", legendY + rectHeight + 53) 
        .attr("text-anchor", "middle") 
        .attr("font-size", "25px") 
        .attr("font-weight", "bold")
        .text("");

        const legend = vis.svg.selectAll(".legend")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) {
                const height = rectHeight + legendSpacing;
                const offset = height * legendData.length / 2;
                const horz = legendX + i * (rectHeight + legendSpacing * 2);
                const vert = legendY;
                return `translate(${horz},${vert})`;
            });
    
        legend.append("rect")
            .attr("width", rectWidth)
            .attr("height", rectHeight)
            .style("fill", d => d.color)
            .style("stroke", "black")
            .style("stroke-width", "2px")
            .on("mouseover", function(event, d) {
                d3.select(this).style("fill", "black"); 
            })
            .on("mouseout", function(event, d) {
                d3.select(this).style("fill", d.color); 
            })
            .on("click", function(event, d) {
                d3.select(this)
                updatePercentageText(d.subcategory, d.color);
                vis.subcategoryNameText
                    .text(`${d.label} irrigation in the United States is used for...`)
                    .style("fill", d.color); 
            });
    
        legend.append("text")
            .attr("x", rectWidth - 80)
            .attr("y", rectHeight - 25)
            .attr("fill", "#EFEFEF")
            .text(d => d.label)
            .on("click", function(event, d) {
                updatePercentageText(d.subcategory, d.color);
                vis.subcategoryNameText
                    .text(`${d.label} irrigation in the United States is used for...`)
                    .style("fill", d.color); 
            });
    
        let rows = 4;
        let cols = 8;
    
        let spacing = 25;
        let matrixPadding = 18;
        let dotRadius = 8; 
        let borderWidth = 1; 

        let totalMatrixWidth = cols * spacing;
        let totalMatrixHeight = (rows * spacing + matrixPadding) * Object.keys(vis.displayData).length - matrixPadding; 
    
        let startX = (vis.width - totalMatrixWidth) / 2 - 55;
        let startY = (vis.height - totalMatrixHeight + 70)

        const categoryNames = {
            "IR": "residential land",
            "IC": "agriculture",
            "IG": "golf courses"
        };
    
        Object.keys(vis.displayData).forEach((category, categoryIndex) => {
            
            let subcategoryData = vis.displayData[category];
            let dotIndex = 0;
    
            Object.keys(subcategoryData).forEach(subcategory => {

                let color;
                if (subcategory === "IrMic") {
                    color = "#6D7048";
                } else if (subcategory === "IrSpr") {
                    color = "#143109";
                } else {
                    color = "#9E788F";
                    
                }


                for (let i = 0; i < subcategoryData[subcategory]; i++) {
                    let col = dotIndex % cols; 
                    let row = Math.floor(dotIndex / cols); 
    

                    let x = startX + col * spacing;
                    let y = startY + categoryIndex * (rows * spacing + matrixPadding) + row * spacing;
    
    
                    vis.svg.append("circle")
                        .attr("cx", x)
                        .attr("cy", y)
                        .attr("r", dotRadius) 
                        .attr("fill", color)
                        .attr("stroke-width", borderWidth)
                        .on("mouseover", function(event, d) {
                            d3.selectAll('circle')
                              .style('opacity', o => o.subcategory === d.subcategory ? 1 : 0.1);
                        })
                        .on("mouseout", function() {
                            d3.selectAll('circle').style('opacity', 1);
                        });
                
    
                    dotIndex++;
                }
    
                if (dotIndex % cols === 0 && dotIndex !== 0) {
                    dotIndex = categoryIndex * rows * cols;
                }
            });

            let displayName = categoryNames[category] || category; 


            let irSurDots = vis.displayData[category]["IrSur"];
            let totalDots = vis.displayData[category]["IrMic"] + vis.displayData[category]["IrSpr"] + vis.displayData[category]["IrSur"];
            let irSurPercentage = Math.round(((irSurDots / totalDots) * 100));  
    
            let textX = startX + totalMatrixWidth - 5; 
            let matricesBBox = vis.svg.node().getBBox();
            let textY = startY + categoryIndex * (rows * spacing + matrixPadding) + rows * spacing / 2 + 5;
    
            vis.svg.append("text")
                .attr("id", `percentage-text-${category}`)
                .attr("x", textX)
                .attr("y", textY)
                .attr("fill", "#9E788F") 
                .attr("font-size", "40") 
                .attr("font-weight", "bold") 
                .attr("dominant-baseline", "middle") 
                .text(`${irSurPercentage}%`);

            const descriptions = [
                `of ${displayName}`,
            ];

            descriptions.forEach((line, i) => {
                vis.svg.append("text")
                    .attr("x", textX)
                    .attr("y", textY + 20 + i * 20 + 20) 
                    .attr("font-size", "23") 
                    .attr("text-transform", "uppercase") 
                    .text(line);
            });
        });
    }
    

}