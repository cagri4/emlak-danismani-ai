import { Context } from 'grammy';

/**
 * Handle /help command
 * Lists all available bot commands in Turkish
 */
export async function handleHelp(ctx: Context): Promise<void> {
  await ctx.reply(
    `Mevcut komutlar:

/ara [sorgu] - Mulk ara (ornek: /ara Cankaya 3+1 daire)
/durum [id] [yeni_durum] - Mulk durumunu guncelle
/eslesmeler - Son eslesmelerimi goster
/help - Bu yardim mesajini goster`
  );
}
