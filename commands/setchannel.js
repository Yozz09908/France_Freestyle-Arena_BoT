const { SlashCommandBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setcandidaturechannel')
    .setDescription('Définit le salon des candidatures (admin uniquement)')
    .addStringOption(option =>
      option.setName('salon')
        .setDescription('Salon à utiliser (mention, ID ou lien complet)')
        .setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({ content: "❌ Tu n'as pas la permission d’utiliser cette commande.", ephemeral: true });
    }

    let input = interaction.options.getString('salon').trim();
    let channelId = null;

    // Si c'est une mention : <#1234567890>
    const mentionMatch = input.match(/^<#(\d+)>$/);
    if (mentionMatch) channelId = mentionMatch[1];

    // Si c'est un lien de type discord.com/channels/serveur/salon
    const linkMatch = input.match(/discord\.com\/channels\/\d+\/(\d+)/);
    if (linkMatch) channelId = linkMatch[1];

    // Si c'est directement un ID
    if (!channelId && /^\d{17,20}$/.test(input)) channelId = input;

    if (!channelId) {
      return interaction.reply({ content: "❌ Format invalide. Fournis une mention, un ID ou un lien de salon valide.", ephemeral: true });
    }

    // Vérifie que le salon existe bien
    const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);
    if (!channel || channel.type !== ChannelType.GuildText) {
      return interaction.reply({ content: "❌ Impossible de trouver un salon textuel avec cet identifiant.", ephemeral: true });
    }

    // Écriture dans config.json
    const configPath = path.resolve(__dirname, '../config.json');
    const config = require(configPath);
    config.candidatureChannelId = channelId;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return interaction.reply(`✅ Salon des candidatures défini sur <#${channelId}>`);
  }
};
