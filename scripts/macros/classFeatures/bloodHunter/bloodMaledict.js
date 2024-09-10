export let bloodMaledict = {
    name: 'Blood Maledict',
    version: '0.12.64',
    ddbi: {
        correctedItems: {
            'Blood Maledict': {
                system: {
                    uses: {
                        max: '1+min(1,floor(@classes.blood-hunter.levels/6))+floor(@classes.blood-hunter.levels/13)+floor(@classes.blood-hunter.levels/17)'
                    }
                }
            }
        }
    }
};