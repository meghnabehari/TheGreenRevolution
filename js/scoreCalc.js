class ScoreCalculator {

    constructor(parentElement, evData, solarData, waterData) {
        this.parentElement = document.getElementById(parentElement);
        this.evData = evData;
        this.solarData = solarData;
        this.waterData = waterData;
        this.scores = {};
        this.states = []; 
        this.initCalc();
    }

    initCalc() {

        this.wrangleData(); 

    }


    wrangleData() {
        let vis = this; 
        vis.scores = {}; 
      

        vis.states.forEach(state => {
            let scoreData = vis.calculateScore(vis.evData, vis.solarData, vis.waterData, state);
            this.scores[state] = scoreData; 
        });


        vis.updateVis();


    }

    calculateScore(evData, solarData, waterData, state) {

        let abbrev = nameConverter.getAbbreviation(state);

        // EV DATA
        let maxEvCount = Math.max(...evData.map(d => +d['RegistrationCount'] || 0));
        let stateEvData = evData.find(d => d.State === abbrev);
        let evCount = stateEvData ? +stateEvData['RegistrationCount'] || 0 : 0;

       // SOLAR DATA
       let maxSolarCount = Math.max(...solarData.map(d => +d['solar'] || 0));
       let stateSolarData = solarData.find(d => d.State === abbrev);
       let solarCount = stateSolarData ? +stateSolarData['solar'] || 0 : 0;

        // WATER DATA
        let stateInfo = []
        let waterUsage; 
        waterData = Array.from(d3.group(waterData, d => d.State), ([key, value]) => ({key, value})); 
        waterData.forEach(State => {

                waterUsage = 0;


                State.value.forEach(entry => {
                    waterUsage += +entry['TotalGroundwaterWithdrawals'];
                });
            

                stateInfo.push(
                    {
                        State: State.key,
                        waterUsage: waterUsage,
                    }
                )

        })

            let maxWaterUsage = Math.max(...stateInfo.map(d => d.waterUsage));
            let matchingStateEntry = stateInfo.find(info => info.State === abbrev);
            waterUsage = matchingStateEntry ? matchingStateEntry.waterUsage : 0;
            console.log(waterUsage);              


            const weights = { evCount: 0.8, solarCount: 0.6, waterUsage: 0.2};

            const normalizedEvCount = evCount / maxEvCount;
            const normalizedSolarCount = solarCount / maxSolarCount;
            const normalizedWaterUsage = 1 - (waterUsage / maxWaterUsage);

            let score = 100 * (
                weights.evCount * normalizedEvCount +
                weights.solarCount * normalizedSolarCount +
                weights.waterUsage * normalizedWaterUsage
            );

            score = Math.round(score);
            score = Math.max(0, Math.min(100, score));
            return {
                State: state,
                evCount: evCount,
                solarCount: solarCount,
                waterUsage: waterUsage,
                score: score
            };
    
    }


    updateVis() {

        let vis = this; 
        
        vis.parentElement.innerHTML = '';

        let scoreTooltip = document.createElement('div');
        scoreTooltip.classList.add('scoreTooltip');
        scoreTooltip.style.display = 'none'; 
        document.body.appendChild(scoreTooltip);


        Object.keys(vis.scores).forEach(state => {
            let score = vis.scores[state].score;

            let stateDiv = document.createElement('div');
            stateDiv.classList.add('state-container'); 

            let stateNameDiv = document.createElement('div');
            stateNameDiv.classList.add('state-name');
            stateNameDiv.textContent = state;
            
            let scoreDiv = document.createElement('div');
            scoreDiv.classList.add('state-score');
            scoreDiv.textContent = score;

            if (score < 20) {
                scoreDiv.style.color = 'red';
            } else if (score >= 20 && score < 50) {
                scoreDiv.style.color = '#E1CE7A';
            } else if (score >= 50) {
                scoreDiv.style.color = 'green';
            }
            stateDiv.appendChild(stateNameDiv);
            stateDiv.appendChild(scoreDiv);

            // TOOLTIP STUFF
            stateDiv.addEventListener('mouseover', function(event) {
                scoreTooltip.innerHTML = ''; // Clear the tooltip for new content
    
                let tooltipContent = document.createElement('div');
                tooltipContent.style.padding = '10px';
                tooltipContent.style.border = '1px solid #ccc';
                tooltipContent.style.backgroundColor = 'white';
                tooltipContent.style.borderRadius = '4px';
                tooltipContent.style.boxShadow = '2px 2px 10px rgba(0,0,0,0.2)';
    
                // Add text for each data point
                let data = vis.scores[state];
                let dataList = [
                    { label: 'EV Count', value: data.evCount.toLocaleString() },
                    { label: 'Solar Count', value: data.solarCount.toLocaleString() },
                    { label: 'Water Usage (mGal/year)', value: data.waterUsage.toLocaleString() }
                ];
    
                dataList.forEach(item => {
                    let dataDiv = document.createElement('div');
                    dataDiv.style.marginBottom = '4px'; // Space between items
    
                    let labelSpan = document.createElement('span');
                    labelSpan.textContent = `${item.label}: `;
                    labelSpan.style.fontWeight = 'bold';
    
                    let valueSpan = document.createElement('span');
                    valueSpan.textContent = item.value;
    
                    dataDiv.appendChild(labelSpan);
                    dataDiv.appendChild(valueSpan);
                    tooltipContent.appendChild(dataDiv);
                });
    
                // Append the tooltip content to the tooltip container
                scoreTooltip.appendChild(tooltipContent);
    
                // Position the tooltip
                scoreTooltip.style.display = 'block';
                scoreTooltip.style.position = 'absolute';
                scoreTooltip.style.left = `${event.pageX }px`; // 10 pixels to the right of the cursor
                scoreTooltip.style.top = `${event.pageY }px`; // 10 pixels below the cursor
            });
    
            stateDiv.addEventListener('mouseout', function() {
                scoreTooltip.style.display = 'none'; 
            });
    
            vis.parentElement.appendChild(stateDiv);
        });
        
    }


}