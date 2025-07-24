const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

// إعدادات أنواع التذاكر
const ticketTypes = {
  discord_products: {
    label: '🛒 طلب شراء منتجات ديسكورد',
    description: 'نيترو / كريت / شحن ألعاب / وغيرها',
    category: '1383660920995057664',
    role: '1382944392158908456',
    questions: [
      { key: 'product', label: 'اسم المنتج', placeholder: 'مثال: نيترو' },
      { key: 'quantity', label: 'الكمية', placeholder: 'مثال: 1' }
    ]
  },
  ulg_products: {
    label: '🌿 طلب شراء منتجات ULG',
    description: 'أخشاب / نفط / دواجن / وغيرها',
    category: '1384285489841836042',
    role: '1383670056894070784',
    questions: [
      { key: 'product', label: 'اسم المنتج', placeholder: 'مثال: أخشاب' },
      { key: 'quantity', label: 'الكمية', placeholder: 'مثال: 100 كجم' }
    ]
  },
  boleto_products: {
    label: '🏗️ طلب شراء منتجات Boleto',
    description: 'أسمنت / حليب / أخشاب / وغيرها',
    category: '1387645856353615942',
    role: '1387991168909840424',
    questions: [
      { key: 'product', label: 'اسم المنتج', placeholder: 'مثال: أسمنت' },
      { key: 'quantity', label: 'الكمية', placeholder: 'مثال: 50 طن' }
    ]
  },
  design_request: {
    label: '🎨 طلب تصميم',
    description: 'تصاميم فوتوشوب / صور / فيديوهات',
    category: '1389132628304859217',
    role: '1389706233061048440',
    questions: [
      { key: 'description', label: 'وصف التصميم', placeholder: 'اشرح التصميم المطلوب أو أرسل صورة مشابهة', style: TextInputStyle.Paragraph }
    ]
  },
  developer_request: {
    label: '💻 طلب مطور ديسكورد',
    description: 'برمجة بوت / سيرفر',
    category: '1389132701302394910',
    role: '1389755242865885184',
    questions: [
      { key: 'service', label: 'الخدمة المطلوبة', placeholder: 'مثال: برمجة بوت', style: TextInputStyle.Paragraph }
    ]
  },
  advertising: {
    label: '📢 الدعاية والإعلان',
    description: 'انشر إعلانك لدينا',
    category: '1384750742065381386',
    role: '1384751310003503116',
    questions: [
      { key: 'company', label: 'اسم الجهة', placeholder: 'اسم الشركة أو الجهة المعلنة' },
      { key: 'advertisement', label: 'نص الإعلان', placeholder: 'اكتب إعلانك هنا', style: TextInputStyle.Paragraph }
    ]
  },
  support: {
    label: '🆘 الدعم الفني',
    description: 'طلب مساعدة من خبراء الديسكورد',
    category: '1386851498914480279',
    role: '1389705439452856340',
    questions: [
      { key: 'reason', label: 'سبب طلب الدعم الفني', placeholder: 'اشرح مشكلتك بالتفصيل', style: TextInputStyle.Paragraph }
    ]
  },
  application: {
    label: '📝 طلبات التقديم',
    description: 'انضم لفرق البائعين / المصممين / المطورين',
    category: '1386850525399617556',
    role: '1382944371745493024',
    questions: [
      { key: 'name', label: 'اسمك', placeholder: 'الاسم الكامل' },
      { key: 'age', label: 'عمرك', placeholder: 'مثال: 25' },
      { key: 'department', label: 'القسم المقدم إليه', placeholder: 'مثال: البائعين / المصممين / المطورين' },
      { key: 'experience', label: 'خبراتك', placeholder: 'اشرح خبراتك في المجال', style: TextInputStyle.Paragraph }
    ]
  },
  complaint: {
    label: '⚠️ الشكاوى',
    description: 'شكوى على عضو / إداري',
    category: '1394520902007525507',
    role: '1382510604107124796',
    questions: [
      { key: 'accused', label: 'اسم المشتكى عليه', placeholder: 'اسم العضو أو الإداري' },
      { key: 'reason', label: 'سبب الشكوى', placeholder: 'اشرح سبب الشكوى بالتفصيل', style: TextInputStyle.Paragraph },
      { key: 'evidence', label: 'الدليل', placeholder: 'أرفق الأدلة أو الروابط', style: TextInputStyle.Paragraph }
    ]
  }
};

const LOG_CHANNEL_ID = '1383290375304908892';

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // القائمة المنسدلة الرئيسية
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select') {
      const ticketType = interaction.values[0];
      const config = ticketTypes[ticketType];
      if (!config) return interaction.reply({ content: '❌ نوع التذكرة غير معروف.', ephemeral: true });
      // بناء المودال
      const modal = new ModalBuilder()
        .setCustomId(`ticket_modal_${ticketType}`)
        .setTitle(config.label);
      config.questions.forEach((q, i) => {
        const input = new TextInputBuilder()
          .setCustomId(`field_${i}`)
          .setLabel(q.label)
          .setStyle(q.style || TextInputStyle.Short)
          .setRequired(true);
        if (q.placeholder) input.setPlaceholder(q.placeholder);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
      });
      await interaction.showModal(modal);
      return;
    }
    // استقبال بيانات المودال وإنشاء التذكرة
    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_modal_')) {
      const ticketType = interaction.customId.replace('ticket_modal_', '');
      const config = ticketTypes[ticketType];
      if (!config) return interaction.reply({ content: '❌ نوع التذكرة غير معروف.', ephemeral: true });
      // جمع البيانات
      const data = {};
      config.questions.forEach((q, i) => {
        data[q.key] = interaction.fields.getTextInputValue(`field_${i}`);
      });
      // رقم التذكرة
      const counterPath = path.join(__dirname, '../ticket-counter.json');
      let ticketNumber = 1;
      if (fs.existsSync(counterPath)) {
        try {
          const counterData = JSON.parse(fs.readFileSync(counterPath, 'utf8'));
          ticketNumber = counterData.counter + 1;
        } catch {}
      }
      fs.writeFileSync(counterPath, JSON.stringify({ counter: ticketNumber }, null, 2));
      // اسم القناة
      const sectionName = config.label.replace(/[^\w\u0600-\u06FF ]/g, '').trim();
      const channelName = `ticket-${interaction.user.username}-${sectionName}-${ticketNumber}`.replace(/\s+/g, '-').toLowerCase();
      // إنشاء القناة
      const guild = interaction.guild;
      const category = config.category;
      const role = config.role;
      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: 0,
        parent: category,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: role, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });
      // Embed الإجابات
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle(`${config.label} | #${ticketNumber}`)
        .setDescription(`**صاحب التذكرة:** ${interaction.user}\n**القسم:** ${sectionName}\n**رقم التذكرة:** #${ticketNumber}`)
        .addFields(Object.entries(data).map(([key, value]) => ({ name: key, value: value, inline: false })))
        .setTimestamp();
      // أزرار التحكم
      const buttons = [
        new ButtonBuilder().setCustomId(`claim_${ticketChannel.id}`).setLabel('استلام التذكرة').setStyle(ButtonStyle.Primary).setEmoji('✅'),
        new ButtonBuilder().setCustomId(`unclaim_${ticketChannel.id}`).setLabel('إلغاء الاستلام').setStyle(ButtonStyle.Secondary).setEmoji('❌'),
        new ButtonBuilder().setCustomId(`close_${ticketChannel.id}`).setLabel('إغلاق التذكرة').setStyle(ButtonStyle.Danger).setEmoji('🔒')
      ];
      // القائمة المنسدلة داخل التذكرة
      const menu = new StringSelectMenuBuilder()
        .setCustomId(`ticket_menu_${ticketChannel.id}`)
        .setPlaceholder('إدارة التذكرة')
        .addOptions([
          { label: 'إضافة شخص', description: 'إضافة شخص إلى التذكرة', value: 'add', emoji: '➕' },
          { label: 'إزالة شخص', description: 'إزالة شخص من التذكرة', value: 'remove', emoji: '➖' },
          { label: 'نداء صاحب التذكرة', description: 'منشن صاحب التذكرة', value: 'ping', emoji: '📢' }
        ]);
      // إرسال الرسائل
      await ticketChannel.send({ content: `<@&${role}> ${interaction.user}`, embeds: [embed], components: [
        new ActionRowBuilder().addComponents(...buttons),
        new ActionRowBuilder().addComponents(menu)
      ] });
      await interaction.reply({ content: `✅ تم إنشاء التذكرة: ${ticketChannel}`, ephemeral: true });
      // إرسال لوج الإنشاء
      const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({ content: `🎫 تذكرة جديدة: ${ticketChannel} | القسم: ${sectionName} | رقم: #${ticketNumber} | بواسطة: ${interaction.user}` });
      }
      return;
    }
    // معالج الأزرار (استلام/إلغاء/إغلاق)
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('claim_')) {
        await interaction.reply({ content: '✅ تم استلام التذكرة.', ephemeral: true });
        // لوج
        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (logChannel) await logChannel.send({ content: `✅ تم استلام التذكرة بواسطة: ${interaction.user}` });
        return;
      }
      if (interaction.customId.startsWith('unclaim_')) {
        await interaction.reply({ content: '❌ تم إلغاء استلام التذكرة.', ephemeral: true });
        // لوج
        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (logChannel) await logChannel.send({ content: `❌ تم إلغاء استلام التذكرة بواسطة: ${interaction.user}` });
        return;
      }
      if (interaction.customId.startsWith('close_')) {
        // طلب سبب الإغلاق
        const ticketId = interaction.customId.replace('close_', '');
        const modal = new ModalBuilder()
          .setCustomId(`close_reason_${ticketId}`)
          .setTitle('سبب إغلاق التذكرة');
        const input = new TextInputBuilder()
          .setCustomId('close_reason')
          .setLabel('سبب الإغلاق')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
        return;
      }
    }
    // استقبال سبب الإغلاق
    if (interaction.isModalSubmit() && interaction.customId.startsWith('close_reason_')) {
      const ticketId = interaction.customId.replace('close_reason_', '');
      const reason = interaction.fields.getTextInputValue('close_reason');
      const channel = interaction.guild.channels.cache.get(ticketId);
      if (!channel) return interaction.reply({ content: '❌ لم يتم العثور على التذكرة', ephemeral: true });
      // استخراج بيانات التذكرة من اسم القناة
      const parts = channel.name.split('-');
      const username = parts[1] || '';
      const sectionName = parts[2] || '';
      const ticketNumber = parts[3] || '';
      // رسالة الإغلاق
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🔒 تم إغلاق التذكرة')
        .setDescription(`**القسم:** ${sectionName}\n**رقم التذكرة:** #${ticketNumber}\n**السبب:** ${reason}\n**الوقت:** <t:${Math.floor(Date.now() / 1000)}:f>`)
        .setTimestamp();
      await channel.send({ embeds: [embed] });
      // لوج الإغلاق
      const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) {
        await logChannel.send({ content: `🔒 تم إغلاق التذكرة | القسم: ${sectionName} | رقم: #${ticketNumber} | السبب: ${reason} | بواسطة: ${interaction.user}` });
      }
      setTimeout(() => channel.delete().catch(() => {}), 5000);
      await interaction.reply({ content: '✅ تم إغلاق التذكرة وستحذف خلال ثوانٍ.', ephemeral: true });
      return;
    }
    // القائمة المنسدلة داخل التذكرة
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('ticket_menu_')) {
      const ticketId = interaction.customId.replace('ticket_menu_', '');
      const value = interaction.values[0];
      const channel = interaction.guild.channels.cache.get(ticketId);
      if (!channel) return interaction.reply({ content: '❌ لم يتم العثور على التذكرة', ephemeral: true });
      if (value === 'add' || value === 'remove') {
        // مودال لإضافة/إزالة شخص
        const modal = new ModalBuilder()
          .setCustomId(`ticket_${value}_user_${ticketId}`)
          .setTitle(value === 'add' ? 'إضافة شخص للتذكرة' : 'إزالة شخص من التذكرة');
        const input = new TextInputBuilder()
          .setCustomId('user_id')
          .setLabel('آيدي أو منشن الشخص')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder('مثال: 123456789 أو @username');
        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
        return;
      }
      if (value === 'ping') {
        await channel.send({ content: `📢 نداء لصاحب التذكرة: <@${channel.permissionOverwrites.cache.find(p => p.allow.has('ViewChannel') && p.id !== interaction.guild.id)?.id || ''}>` });
        await interaction.reply({ content: '✅ تم نداء صاحب التذكرة', ephemeral: true });
        return;
      }
    }
    // إضافة/إزالة شخص فعليًا
    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_add_user_')) {
      const ticketId = interaction.customId.replace('ticket_add_user_', '');
      const userInput = interaction.fields.getTextInputValue('user_id');
      const userId = userInput.replace(/<@!?(\d+)>/, '$1');
      const channel = interaction.guild.channels.cache.get(ticketId);
      if (!channel) return interaction.reply({ content: '❌ لم يتم العثور على التذكرة', ephemeral: true });
      await channel.permissionOverwrites.edit(userId, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
      await channel.send({ content: `➕ تم إضافة <@${userId}> للتذكرة بواسطة ${interaction.user}` });
      await interaction.reply({ content: '✅ تم إضافة الشخص', ephemeral: true });
      return;
    }
    if (interaction.isModalSubmit() && interaction.customId.startsWith('ticket_remove_user_')) {
      const ticketId = interaction.customId.replace('ticket_remove_user_', '');
      const userInput = interaction.fields.getTextInputValue('user_id');
      const userId = userInput.replace(/<@!?(\d+)>/, '$1');
      const channel = interaction.guild.channels.cache.get(ticketId);
      if (!channel) return interaction.reply({ content: '❌ لم يتم العثور على التذكرة', ephemeral: true });
      await channel.permissionOverwrites.delete(userId);
      await channel.send({ content: `➖ تم إزالة <@${userId}> من التذكرة بواسطة ${interaction.user}` });
      await interaction.reply({ content: '✅ تم إزالة الشخص', ephemeral: true });
      return;
    }
  }
}; 
