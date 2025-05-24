require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// Remplace ça par ton vrai client ID et ton serveur ID (si tu veux en local)
const CLIENT_ID = '1375453785501208626';
const GUILD_ID = '1363216356912136343';

(async () => {
  try {
    console.log('Enregistrement des commandes slash...');

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), // Pour les tests uniquement dans un serveur
      { body: commands }
    );

    console.log('Commandes enregistrées avec succès !');
  } catch (error) {
    console.error(error);
  }
})();
