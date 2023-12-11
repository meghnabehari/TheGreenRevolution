/* * * * * * * * * * * * * *
*      NameConverter       *
* * * * * * * * * * * * * */
class StateToRegionConverter {
    constructor() {
        this.stateToRegion = {
            'Connecticut': 'Northeast',
            'Maine': 'Northeast',
            'Massachusetts': 'Northeast',
            'New Hampshire': 'Northeast',
            'Rhode Island': 'Northeast',
            'Vermont': 'Northeast',
            'New Jersey': 'Northeast',
            'New York': 'Northeast',
            'Pennsylvania': 'Northeast',
            'Illinois': 'Midwest',
            'Indiana': 'Midwest',
            'Michigan': 'Midwest',
            'Ohio': 'Midwest',
            'Wisconsin': 'Midwest',
            'Iowa': 'Midwest',
            'Kansas': 'Midwest',
            'Minnesota': 'Midwest',
            'Missouri': 'Midwest',
            'Nebraska': 'Midwest',
            'North Dakota': 'Midwest',
            'South Dakota': 'Midwest',
            'Delaware': 'South',
            'Florida': 'South',
            'Georgia': 'South',
            'Maryland': 'South',
            'North Carolina': 'South',
            'South Carolina': 'South',
            'Virginia': 'South',
            'West Virginia': 'South',
            'Alabama': 'South',
            'Kentucky': 'South',
            'Mississippi': 'South',
            'Tennessee': 'South',
            'Arkansas': 'South',
            'Louisiana': 'South',
            'Oklahoma': 'South',
            'Texas': 'South',
            'Arizona': 'West',
            'Colorado': 'West',
            'Idaho': 'West',
            'Montana': 'West',
            'Nevada': 'West',
            'New Mexico': 'West',
            'Utah': 'West',
            'Wyoming': 'West',
            'Alaska': 'West',
            'California': 'West',
            'Hawaii': 'West',
            'Oregon': 'West',
            'Washington': 'West' 
        };
    }

    getRegion(input) {
        return this.stateToRegion[input] || 'Region not found';
    }
}
class NameConverter {
    constructor() {
        this.states = [
            ['Alabama', 'AL'],
            ['Alaska', 'AK'],
            ['American Samoa', 'AS'],
            ['Arizona', 'AZ'],
            ['Arkansas', 'AR'],
            ['Armed Forces Americas', 'AA'],
            ['Armed Forces Europe', 'AE'],
            ['Armed Forces Pacific', 'AP'],
            ['California', 'CA'],
            ['Colorado', 'CO'],
            ['Connecticut', 'CT'],
            ['Delaware', 'DE'],
            ['District of Columbia', 'DC'],
            ['Florida', 'FL'],
            ['Georgia', 'GA'],
            ['Guam', 'GU'],
            ['Hawaii', 'HI'],
            ['Idaho', 'ID'],
            ['Illinois', 'IL'],
            ['Indiana', 'IN'],
            ['Iowa', 'IA'],
            ['Kansas', 'KS'],
            ['Kentucky', 'KY'],
            ['Louisiana', 'LA'],
            ['Maine', 'ME'],
            ['Marshall Islands', 'MH'],
            ['Maryland', 'MD'],
            ['Massachusetts', 'MA'],
            ['Michigan', 'MI'],
            ['Minnesota', 'MN'],
            ['Mississippi', 'MS'],
            ['Missouri', 'MO'],
            ['Montana', 'MT'],
            ['Nebraska', 'NE'],
            ['Nevada', 'NV'],
            ['New Hampshire', 'NH'],
            ['New Jersey', 'NJ'],
            ['New Mexico', 'NM'],
            ['New York', 'NY'],
            ['North Carolina', 'NC'],
            ['North Dakota', 'ND'],
            ['Northern Mariana Islands', 'NP'],
            ['Ohio', 'OH'],
            ['Oklahoma', 'OK'],
            ['Oregon', 'OR'],
            ['Pennsylvania', 'PA'],
            ['Puerto Rico', 'PR'],
            ['Rhode Island', 'RI'],
            ['South Carolina', 'SC'],
            ['South Dakota', 'SD'],
            ['Tennessee', 'TN'],
            ['Texas', 'TX'],
            ['US Virgin Islands', 'VI'],
            ['Utah', 'UT'],
            ['Vermont', 'VT'],
            ['Virginia', 'VA'],
            ['Washington', 'WA'],
            ['West Virginia', 'WV'],
            ['Wisconsin', 'WI'],
            ['Wyoming', 'WY']
        ]
    }

    getAbbreviation(input) {
        let that = this
        let output = '';
        that.states.forEach(state => {
            if (state[0] === input) {
                output = state[1]
            }
        })
        return output
    }

    getFullName(input) {
        let that = this
        let output = '';
        that.states.forEach(state => {
            if (state[1] === input) {
                output = state[0]
            }
        })
        return output
    }
}

let nameConverter = new NameConverter()


