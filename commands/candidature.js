const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('candidature')
    .setDescription('Soumet une vidéo de candidature.')
    .addStringOption(option =>
      option.setName('lien')
        .setDescription('Lien de la vidéo YouTube')
        .setRequired(true)
    ),
  async execute(interaction) {
    const allowedChannelId = config.candidatureChannelId;

    if (interaction.channelId !== allowedChannelId) {
      return interaction.reply({
        content: `❌ Utilise cette commande dans <#${allowedChannelId}> uniquement.`,
        ephemeral: true
      });
    }

    const lien = interaction.options.getString('lien');
    const videoId = extractYouTubeID(lien);
    if (!videoId) {
      return interaction.reply({ content: "❌ Lien YouTube invalide.", ephemeral: true });
    }

    let titre = "Vidéo YouTube";
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`);
      titre = response.data.items[0]?.snippet?.title || titre;
    } catch (err) {
      console.error("Erreur récupération titre YouTube :", err.message);
    }

    const embed = new EmbedBuilder()
      .setDescription(`**Nouvelle candidature de <@${interaction.user.id}>\n\n[${titre}](${lien})**`)
      .setImage(`https://img.youtube.com/vi/${videoId}/0.jpg`)
      .setColor(0xff0000)
      .setTimestamp()
      .setFooter({ text: 'France Freestyle Arena' });

    const reply = await interaction.reply({ embeds: [embed], fetchReply: true });

    // Sauvegarde message.id -> interaction.user.id
    const dataPath = path.resolve(__dirname, '../candidatures.json');
    let candidatures = {};
    if (fs.existsSync(dataPath)) {
      candidatures = JSON.parse(fs.readFileSync(dataPath));
    }
    candidatures[reply.id] = interaction.user.id;
    fs.writeFileSync(dataPath, JSON.stringify(candidatures, null, 2));
  }
};

function extractYouTubeID(url) {
  const regex = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
