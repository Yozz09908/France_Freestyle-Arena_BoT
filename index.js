require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

// Charger les commandes
const commandFiles = fs.readdirSync('./commands').filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
  }
});

// 🎯 Réaction ajoutée → donner rôle à l’auteur
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  const config = require('./config.json');
  const candidatures = fs.existsSync('./candidatures.json') ? JSON.parse(fs.readFileSync('./candidatures.json')) : {};
  const reactionRoles = fs.existsSync('./reactionRoles.json') ? JSON.parse(fs.readFileSync('./reactionRoles.json')) : {};

  if (reaction.message.channelId !== config.candidatureChannelId) return;

  const emojiName = reaction.emoji.name;
  const roleId = reactionRoles[emojiName];
  if (!roleId) return;

  const authorId = candidatures[reaction.message.id];
  if (!authorId) return;

  const member = await reaction.message.guild.members.fetch(authorId).catch(() => null);
  if (!member) return;

  if (!member.roles.cache.has(roleId)) {
    await member.roles.add(roleId).catch(console.error);
    console.log(`✅ Rôle ${roleId} attribué à ${member.user.tag} via emoji ${emojiName}`);
  }
});

// 🧼 Réaction supprimée → retirer le rôle
client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;

  const config = require('./config.json');
  const candidatures = fs.existsSync('./candidatures.json') ? JSON.parse(fs.readFileSync('./candidatures.json')) : {};
  const reactionRoles = fs.existsSync('./reactionRoles.json') ? JSON.parse(fs.readFileSync('./reactionRoles.json')) : {};

  if (reaction.message.channelId !== config.candidatureChannelId) return;

  const emojiName = reaction.emoji.name;
  const roleId = reactionRoles[emojiName];
  if (!roleId) return;

  const authorId = candidatures[reaction.message.id];
  if (!authorId) return;

  const member = await reaction.message.guild.members.fetch(authorId).catch(() => null);
  if (!member) return;

  if (member.roles.cache.has(roleId)) {
    await member.roles.remove(roleId).catch(console.error);
    console.log(`❌ Rôle ${roleId} retiré de ${member.user.tag} via suppression de la réaction ${emojiName}`);
  }
});

client.login(process.env.TOKEN);
