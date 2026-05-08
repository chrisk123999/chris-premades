export let clairvoyantCombatant = {
    name: 'Clairvoyant Combatant',
    version: '1.5.21',
    rules: 'modern',
    ddbi: {
        correctedItems: {
            'Clairvoyant Combatant': {
                system: {
                    uses: {
                        recovery: [
                            {
                                period: 'sr',
                                type: 'recoverAll'
                            },
                            {
                                period: 'lr',
                                type: 'recoverAll'
                            }
                        ]
                    }
                }
            }
        }
    }
};
