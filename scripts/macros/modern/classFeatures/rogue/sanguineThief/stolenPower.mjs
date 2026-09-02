export const stolenPower = {
    name: 'Stolen Power',
    version: '2.0.3',
    rules: '2024',
    scales: [
        {
            identifier: 'sneak-attack',
            classIdentifier: 'rogue'
        }
    ],
    config: {
        classIdentifier: {
            default: 'rogue',
            type: 'text',
            label: 'CHRISPREMADES.Config.ClassIdentifier',
            category: 'behavior',
            hint: ''
        }
    }
};