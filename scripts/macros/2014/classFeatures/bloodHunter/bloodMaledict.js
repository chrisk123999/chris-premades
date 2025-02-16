export let bloodMaledict = {
    name: 'Blood Maledict',
    version: '1.1.0',
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