const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_API_KEY = process.env.WEBHOOK_API_KEY;
const ALLOWED_CHANNEL_ID = "1328360779233362031";

client.once('ready', async () => {
    console.log(`Bot está online como ${client.user.tag}`);

    // Envia a mensagem com o botão permanentemente no canal ao iniciar o bot
    const channel = await client.channels.fetch(ALLOWED_CHANNEL_ID);
    if (channel) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('email_request')
                .setLabel('Solicitar Verificação')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('✨') // Adiciona um emoji ao botão
        );

        const embed = new EmbedBuilder()
            .setTitle('Validação de Email de Compra')
            .setDescription('Se você adquiriu um produto da Hotmart, clique no botão abaixo.')
            .addFields({ name: 'Orientações:', value: 'Clique no botão "Solicitar Verificação" para começar.' })
            .setColor('Green')
            .setThumbnail('https://via.placeholder.com/100')
            .setFooter({ text: 'Bot Forms', iconURL: 'https://via.placeholder.com/50' });

        await channel.send({ embeds: [embed], components: [row] });
    } else {
        console.error("Canal não encontrado. Verifique o ID do canal.");
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton()) {
        if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
            await interaction.reply({ content: "Este bot só pode ser usado no canal designado.", flags: MessageFlags.Ephemeral });
            return;
        }

        if (interaction.customId === 'email_request') {
            const modal = new ModalBuilder()
                .setCustomId('email_form')
                .setTitle('Verificação de Email de Compra')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('email')
                            .setLabel('Digite seu email da Hotmart')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('exemplo@email.com')
                    )
                );

            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'email_form') {
            const email = interaction.fields.getTextInputValue('email');

            const waitingEmbed = new EmbedBuilder()
                .setTitle('Processando')
                .setDescription('Aguarde enquanto verificamos seu email.')
                .setColor('Yellow');

            await interaction.reply({ embeds: [waitingEmbed], flags: MessageFlags.Ephemeral });

            try {
                const response = await axios.post(WEBHOOK_URL, {
                    email,
                    discordId: interaction.user.id,
                    username: interaction.user.username
                }, {
                    headers: {
                        'Authorization': WEBHOOK_API_KEY
                    }
                });

                if (response.status === 200) {
                    const approvedEmbed = new EmbedBuilder()
                        .setTitle('Aprovado')
                        .setDescription('Seu email foi verificado com sucesso!')
                        .setColor('Green');

                    await interaction.editReply({ embeds: [approvedEmbed] });
                } else {
                    throw new Error('Resposta inválida do webhook.');
                }
            } catch (error) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Erro')
                    .setDescription('Ocorreu um erro ao verificar seu email. Por favor, tente novamente mais tarde.')
                    .setColor('Red');

                await interaction.editReply({ embeds: [errorEmbed] });
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);