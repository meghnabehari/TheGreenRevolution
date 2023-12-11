/**
 * Main Script
 *
 * This script initializes and manages the main visualization components and handles user interactions.
 */

// Declare variables for visualization instances
let myMapVis;
let myBarVis;
let heatmapVis;
let myAreaVis;
let myInnovVis;

// Load data using promises
let promises = [
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json"), // USA map data
    d3.csv("data/ev-registration-counts-by-state.csv"), // Electric vehicle registration data
    d3.csv("data/solar_power.csv"), // Solar power data
    d3.csv("data/water_conservation_data.csv"), // Water conservation data
    d3.csv("data/solarData-area.csv"), // Solar data for area chart
    d3.json("data/airports.json"), // Airports data
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json"), // World map data
    d3.csv("data/countries_emissions_ids.csv"), // Countries emissions data
    d3.tsv("data/world-110m-country-names.tsv"), // World country names data
];

// Wait for all promises to resolve
Promise.all(promises)
    .then(function (data) {
        // Initialize the main page with data
        initMainPage(data);
    })
    .catch(function (err) {
        console.log("Error loading data:", err);
    });

// Event listener for clicking icon buttons
$(document).on('click', '.icon-item', function () {
    // Remove 'icon-clicked' class from all icons and add it to the clicked icon
    $('.icon-item').removeClass('icon-clicked');
    $(this).addClass('icon-clicked');

    // Determine the selected metric based on the clicked icon
    let metric;
    if (this.id === 'water_button') {
        metric = "Water Conservation";
    } else if (this.id === 'solar_panels') {
        metric = "Solar Panels";
    } else if (this.id === 'electric_vehicles') {
        metric = "Electric Vehicles";
    }

    // Update the selected category for all visualization instances
    updateCategory(metric);
});

// Function to update the selected category for all visualizations
function updateCategory(metric) {
    let selectedCategory = getSelectedCategory(metric);

    // Update the selected category for each visualization instance
    myMapVis.selectedCategory = selectedCategory;
    myBarVis.selectedCategory = selectedCategory;
    myAreaVis.selectedCategory = selectedCategory;
    heatmapVis.selectedCategory = selectedCategory;
    myInnovVis.selectedCategory = selectedCategory;

    // Update the visualizations
    myInnovVis.updateVis();
    myMapVis.updateVis();
    myBarVis.updateVis();
    heatmapVis.updateVis();
    myAreaVis.updateVis();
}

// Map metric names to corresponding category names
function getSelectedCategory(metric) {
    switch (metric) {
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

// Initialize the main page with visualizations and data processing
function initMainPage(allDataArray) {
    console.log("initMainPage");

    // Create instances of various visualization components
    myMapVis = new MapVis('mapDiv', allDataArray[0], allDataArray[1], allDataArray[2], allDataArray[3]);
    myGlobeVis = new GlobeVis('globeDiv', allDataArray[7], allDataArray[6], allDataArray[8]);
    myBarVis = new BarVis('barDiv', allDataArray[1], allDataArray[2], allDataArray[3]);

    // Load and process CSV data for heatmap visualization
    d3.csv("data/solar-data-region.csv", row => {
        row.Year = +row.Year;
        row.Generation = +row.Generation;
        return row;
    }).then((data) => {
        console.log(data);
        heatmapVis = new Heatmap("my_dataviz", data);
    });

    myAreaVis = new StackedAreaChart("areaDiv", allDataArray[4]);

    // Process water data for the innovation visualization
    let processedWaterData = processDataForInnovVis(allDataArray[3]);

    // Process water data for the matrix visualization
    let processedMatrixData = processDataForMatrixVis(allDataArray[3]);

    // Create instances of the innovation and dot matrix visualizations
    myInnovVis = new InnovVis('innovDiv', processedWaterData);
    myDotMatrix = new DotMatrix('matrixDiv', processedMatrixData);

    // Create an instance of the score calculator
    scoreCalculator = new ScoreCalculator('statesScores', allDataArray[1], allDataArray[2], allDataArray[3]);
}

// Handle changes in selected states for visualizations
function stateChange(selectedStates) {
    console.log("state change:", selectedStates);

    // Update selected states for the bar chart visualization and trigger data wrangling
    myBarVis.selectedStates = selectedStates;
    myBarVis.wrangleData();

    // Update selected states for the stacked area chart visualization and trigger data wrangling
    myAreaVis.selectedStates = selectedStates;
    myAreaVis.wrangleData();

    // Update selected states for the heatmap visualization and trigger data wrangling
    heatmapVis.selectedStates = selectedStates;
    heatmapVis.wrangleData();

    // Update selected state for the innovation visualization and trigger data wrangling
    myInnovVis.state = selectedStates[selectedStates.length - 1];
    myInnovVis.wrangleData();

    // Update selected states for the score calculator and trigger data wrangling
    scoreCalculator.states = selectedStates;
    scoreCalculator.wrangleData();

    // Populate the dropdown list with selected states
    populateDropdown(selectedStates);
}

// Populate the dropdown list with selected states for user interaction
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

// Handle change in the selected state from the dropdown list
document.getElementById('state-dropdown').addEventListener('change', function () {
    const selectedState = this.value;
    myInnovVis.state = selectedState;
    myInnovVis.wrangleData();
});

// Process water data for the innovation visualization
function processDataForInnovVis(waterData) {
    let groupedByState = d3.groups(waterData, d => d.State);

    let summedByState = groupedByState.map(([state, values]) => {
        let sums = values.reduce((acc, curr) => {
            acc["IR-CUsFr"] += +curr["IR-CUsFr"];
            acc["PT-CUTot"] += +curr["PT-CUTot"];
            acc["IN-Wtotl"] += +curr["IN-Wtotl"];
            acc["MI-Wtotl"] += +curr["MI-Wtotl"];
            acc["LI-WFrTo"] += +curr["LI-WFrTo"];
            acc["AQ-Wtotl"] += +curr["AQ-Wtotl"];
            return acc;
        }, {
            "State": state,
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

// Process water data for the matrix visualization
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