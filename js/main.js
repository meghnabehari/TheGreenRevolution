/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

let myMapVis;
let myBarVis;
let heatmapVis; 
let myAreaVis;
let myInnovVis; 
// load data using promises
let promises = [

    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json"), // already projected -> you can just scale it to fit your browser window
    d3.csv("data/ev-registration-counts-by-state.csv"),
    d3.csv("data/solar_power.csv"),
    d3.csv("data/water_conservation_data.csv"),
    d3.csv("data/solarData-area.csv"), 
    d3.json("data/airports.json"), 
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"), 
    d3.csv("data/countries_emissions_ids.csv"), 
    d3.tsv("data/world-110m-country-names.tsv")
];
Promise.all(promises)
    .then(function (data) {
        console.log("in promise")
        initMainPage(data)
    })
    .catch(function (err) {
        console.log("error here")
        console.log(err)
    });


$(document).on('click', '.icon-item', function() {
    $('.icon-item').removeClass('icon-clicked');
    $(this).addClass('icon-clicked');


    let metric;
    if (this.id === 'water_button') {
        metric = "Water Conservation";
    } else if (this.id === 'solar_panels') {
        metric = "Solar Panels";
    } else if (this.id === 'electric_vehicles') {
        metric = "Electric Vehicles";
    }

    updateCategory(metric);
});

function updateCategory(metric) {

    let selectedCategory = getSelectedCategory(metric);
    
    console.log(selectedCategory)

    myMapVis.selectedCategory = selectedCategory;
    myBarVis.selectedCategory = selectedCategory;
    myAreaVis.selectedCategory = selectedCategory;
    heatmapVis.selectedCategory = selectedCategory;
    myInnovVis.selectedCategory = selectedCategory; 

    myInnovVis.updateVis(); 
    myMapVis.updateVis();
    myBarVis.updateVis();
    heatmapVis.updateVis();
    myAreaVis.updateVis();
    // Check if the selected category is 'solarCount'
}

function getSelectedCategory(metric) {
    switch(metric) {
        case "Water Conservation":
            return "waterUsage";
        case "Solar Panels":
            return "solarCount";
        case "Electric Vehicles":
            return "evCount";
        default:
            return ""; 
    }
}

//console.log('solar Data', allDataArray[2]);

function initMainPage(allDataArray) {
    console.log("initMainPage")
    myMapVis = new MapVis('mapDiv', allDataArray[0], allDataArray[1], allDataArray[2], allDataArray[3]);
    myGlobeVis = new GlobeVis('globeDiv', allDataArray[7], allDataArray[6], allDataArray[8])
   // let myBarVis;
    myBarVis = new BarVis('barDiv', allDataArray[1], allDataArray[2], allDataArray[3]);
    //myBarVis = new BarVis('barDiv', allDataArray[1]);
    d3.csv("data/solar-data-region.csv", row => {
        row.Year = +row.Year;
        row.Generation = +row.Generation;
        return row;
    }).then((data) => {
        console.log(data);

        // Create a new heatmap
        heatmapVis = new Heatmap("my_dataviz", data);
    });
    myAreaVis = new StackedAreaChart("areaDiv", allDataArray[4]);

    let processedWaterData = processDataForInnovVis(allDataArray[3]);
    let processedMatrixData = processDataForMatrixVis(allDataArray[3]); 
   
    myInnovVis = new InnovVis('innovDiv', processedWaterData);
    myDotMatrix = new DotMatrix('matrixDiv', processedMatrixData); 

    scoreCalculator = new ScoreCalculator('statesScores', allDataArray[1], allDataArray[2], allDataArray[3]);

}

function stateChange(selectedStates) {

    
    
    console.log("state change:", selectedStates);


    myBarVis.selectedStates = selectedStates;
    myBarVis.wrangleData(); 

    myAreaVis.selectedStates = selectedStates;
    myAreaVis.wrangleData();

    heatmapVis.selectedStates = selectedStates;
    heatmapVis.wrangleData();

    myInnovVis.state = selectedStates[selectedStates.length-1]; 
    myInnovVis.wrangleData(); 

    scoreCalculator.states = selectedStates; 
    scoreCalculator.wrangleData();

    populateDropdown(selectedStates); 
    
}

function populateDropdown(selectedStates) {
    const dropdown = document.getElementById('state-dropdown');
    dropdown.innerHTML = ''; 
    selectedStates.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.text = state;
        dropdown.appendChild(option);
    });

    if (selectedStates.length > 0) {
        dropdown.value = selectedStates[selectedStates.length - 1];
    }

    const dropdownContainer = document.getElementById('dropdown-container');
    dropdownContainer.style.display = 'block';
}

document.getElementById('state-dropdown').addEventListener('change', function() {
    const selectedState = this.value;
    myInnovVis.state = selectedState; 
    myInnovVis.wrangleData(); 
});

function processDataForInnovVis(waterData) {

    let groupedByState = d3.groups(waterData, d => d.State);

    let summedByState = groupedByState.map(([state, values]) => {
        let sums = values.reduce((acc, curr) => {
            // acc["DO-WDelv"] += +curr["DO-WDelv"];
            acc["IR-CUsFr"] += +curr["IR-CUsFr"];
            acc["PT-CUTot"] += +curr["PT-CUTot"];
            acc["IN-Wtotl"] += +curr["IN-Wtotl"];
            acc["MI-Wtotl"] += +curr["MI-Wtotl"];
            acc["LI-WFrTo"] += +curr["LI-WFrTo"];
            acc["AQ-Wtotl"] += +curr["AQ-Wtotl"];
            return acc;
        }, {
            "State": state,
            // "DO-WDelv": 0,
            "IR-CUsFr": 0,
            "PT-CUTot": 0,
            "IN-Wtotl": 0,
            "MI-Wtotl": 0,
            "LI-WFrTo": 0,
            "AQ-Wtotl": 0
        });
        return sums;
    });

    return summedByState;
}

function processDataForMatrixVis(waterData) {

    let sums = waterData.reduce((acc, curr) => {
        acc["IR"]["IrTot"] += +curr["IR-IrTot"];
        acc["IR"]["IrSur"] += +curr["IR-IrSur"];
        acc["IR"]["IrMic"] += +curr["IR-IrMic"];
        acc["IR"]["IrSpr"] += +curr["IR-IrSpr"];

        acc["IC"]["IrTot"] += +curr["IC-IrTot"];
        acc["IC"]["IrSur"] += +curr["IC-IrSur"];
        acc["IC"]["IrMic"] += +curr["IC-IrMic"];
        acc["IC"]["IrSpr"] += +curr["IC-IrSpr"];

        acc["IG"]["IrTot"] += +curr["IG-IrTot"];
        acc["IG"]["IrSur"] += +curr["IG-IrSur"];
        acc["IG"]["IrMic"] += +curr["IG-IrMic"];
        acc["IG"]["IrSpr"] += +curr["IG-IrSpr"];

        return acc;
    }, {
        "IR": { "IrTot": 0, "IrSur": 0, "IrMic": 0, "IrSpr": 0 },
        "IC": { "IrTot": 0, "IrSur": 0, "IrMic": 0, "IrSpr": 0 },
        "IG": { "IrTot": 0, "IrSur": 0, "IrMic": 0, "IrSpr": 0 }
    });
    
    let formattedData = {
        "IR": { "total": sums["IR"]["IrTot"] },
        "IC": { "total": sums["IC"]["IrTot"] },
        "IG": { "total": sums["IG"]["IrTot"] }
    };

    Object.keys(formattedData).forEach(category => {
        formattedData[category]["IrMic"] = sums[category]["IrMic"];
        formattedData[category]["IrSpr"] = sums[category]["IrSpr"];
        formattedData[category]["IrSur"] = sums[category]["IrSur"];
    });

    return formattedData;
}
