const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const WEBHOOK_API_KEY = process.env.WEBHOOK_API_KEY;
const ALLOWED_CHANNEL_ID = process.env.ALLOWED_CHANNEL_ID;

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
            .setTitle('DinastIA: Validar compra!')
            .setDescription('Se você adquiriu um produto da DinastIA, clique no botão abaixo.')
            .addFields({ name: 'Orientações:', value: 'Clique no botão "Solicitar Verificação" para começar.' })
            .setColor('Green')
            .setThumbnail('https://via.placeholder.com/100');

        await channel.send({ embeds: [embed], components: [row] });
    } else {
        console.error("Canal não encontrado. Verifique o ID do canal.");
    }
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isButton()) {
            if (interaction.channelId !== ALLOWED_CHANNEL_ID) {
                await interaction.reply({ content: "Este bot só pode ser usado no canal designado.", flags: MessageFlags.Ephemeral });
                return;
            }

            if (interaction.customId === 'email_request') {
                try {
                    const modal = new ModalBuilder()
                        .setCustomId('email_form')
                        .setTitle('Verificação de Email de Compra')
                        .addComponents(
                            new ActionRowBuilder().addComponents(
                                new TextInputBuilder()
                                    .setCustomId('email')
                                    .setLabel('Digite o email usado na compra.')
                                    .setStyle(TextInputStyle.Short)
                                    .setPlaceholder('exemplo@email.com')
                                    .setRequired(true)
                            )
                        );

                    await interaction.showModal(modal);
                } catch (error) {
                    console.error('Erro ao mostrar modal:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ 
                            content: 'Ocorreu um erro ao abrir o formulário. Por favor, tente novamente.', 
                            flags: MessageFlags.Ephemeral 
                        });
                    }
                }
            }
        } else if (interaction.isModalSubmit()) {
            if (interaction.customId === 'email_form') {
                try {
                    const email = interaction.fields.getTextInputValue('email');

                    await interaction.deferReply({ ephemeral: true });

                    const waitingEmbed = new EmbedBuilder()
                        .setTitle('Processando')
                        .setDescription('Aguarde enquanto verificamos seu email.')
                        .setColor('Yellow');

                    await interaction.editReply({ embeds: [waitingEmbed] });

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
                                .setDescription('Seu email foi verificado com sucesso! Seja bem vindo(a) DinastIA!')
                                .setColor('Green');

                            await interaction.editReply({ embeds: [approvedEmbed] });
                        } else {
                            throw new Error('Resposta inválida do webhook.');
                        }
                    } catch (error) {
                        console.error('Erro na requisição do webhook:', error);
                        const errorEmbed = new EmbedBuilder()
                            .setTitle('Erro')
                            .setDescription('Infelizmente não conseguimos verificar seu email. Por favor, confirme se o seus dados estão corretos, tente novamente ou chame um membro de nossa equipe.')
                            .setColor('Red');

                        await interaction.editReply({ embeds: [errorEmbed] });
                    }
                } catch (error) {
                    console.error('Erro ao processar modal:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({ 
                            content: 'Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.', 
                            flags: MessageFlags.Ephemeral 
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('Erro geral na interação:', error);
        if (!interaction.replied && !interaction.deferred) {
            try {
                await interaction.reply({ 
                    content: 'Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.', 
                    flags: MessageFlags.Ephemeral 
                });
            } catch (replyError) {
                console.error('Erro ao enviar mensagem de erro:', replyError);
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
