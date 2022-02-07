import { ButtonInteraction, Interaction } from 'discord.js';
import { onLfgButton } from '../structures/LFG';

const onInteractButton = (i: ButtonInteraction) => {
	console.log(i.customId);
	let customId: string = i.customId;
	if (customId.startsWith('lfg-button') || customId.startsWith('lfg-leave-button')) onLfgButton(i);
};

export default {
	tag: 'interactionCreate',
	run: async (i: Interaction) => {
		console.log('Here.');
		if (i.isButton()) onInteractButton(i);
	},
};
