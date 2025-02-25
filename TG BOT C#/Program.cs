using System;
using System.Net.Http;
using System.Threading.Tasks;
using System.IO;
using System.Data;
using Dapper;
using Npgsql;
using Telegram.Bot;
using Telegram.Bot.Polling;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;
using HtmlAgilityPack;
using ZXing;
using ZXing.QrCode;
using YouTubeExplode;
using YouTubeExplode.Videos.Streams;
using Newtonsoft.Json.Linq;

class Program
{
    private static readonly string _connectionString = "Host=localhost;Port=5432;Database=telegram_bot;Username=postgres;Password=yourpassword";
    private static readonly TelegramBotClient botClient = new TelegramBotClient("YOUR_BOT_TOKEN");
    private static readonly HttpClient httpClient = new HttpClient();
    private static readonly YouTubeClient youtubeClient = new YouTubeClient();

    static async Task Main()
    {
        Console.WriteLine("Бот запущен...");

        using var cts = new System.Threading.CancellationTokenSource();
        botClient.StartReceiving(HandleUpdateAsync, HandleErrorAsync, new ReceiverOptions { AllowedUpdates = { } }, cts.Token);

        await Task.Delay(-1);
    }

    private static async Task HandleUpdateAsync(ITelegramBotClient bot, Update update, System.Threading.CancellationToken token)
    {
        if (update.Message is null) return;

        string messageText = update.Message.Text;
        long chatId = update.Message.Chat.Id;

        if (messageText.StartsWith("/start"))
        {
            await bot.SendTextMessageAsync(chatId, "Привет! Доступные команды:\n" +
                "/register - Регистрация\n" +
                "/weather Город - Погода\n" +
                "/news - Новости\n" +
                "/currency USD - Курс валют\n" +
                "/crypto BTC - Курс криптовалют\n" +
                "/convert 100 USD EUR - Конвертер валют\n" +
                "/password - Генератор пароля\n" +
                "/qr TEXT - Генерация QR-кода\n" +
                "/parse URL - Парсер сайта\n" +
                "/ai ТЕКСТ - AI-беседа\n" +
                "/download YouTube_URL - Скачать MP3\n" +
                "/reminder ТЕКСТ 10 - Напоминание через 10 мин.", cancellationToken: token);
        }
        else if (messageText.StartsWith("/register"))
        {
            await RegisterUser(chatId, update.Message.Chat.Username);
            await bot.SendTextMessageAsync(chatId, "Вы зарегистрированы!", cancellationToken: token);
        }
        else if (messageText.StartsWith("/weather"))
        {
            string city = messageText.Replace("/weather ", "").Trim();
            string weather = await GetWeather(city);
            await bot.SendTextMessageAsync(chatId, weather, cancellationToken: token);
        }
        else if (messageText.StartsWith("/news"))
        {
            string news = await GetNews();
            await bot.SendTextMessageAsync(chatId, news, cancellationToken: token);
        }
        else if (messageText.StartsWith("/currency"))
        {
            string currency = messageText.Replace("/currency ", "").Trim();
            string rate = await GetCurrencyRate(currency);
            await bot.SendTextMessageAsync(chatId, rate, cancellationToken: token);
        }
        else if (messageText.StartsWith("/crypto"))
        {
            string crypto = messageText.Replace("/crypto ", "").Trim();
            string price = await GetCryptoPrice(crypto);
            await bot.SendTextMessageAsync(chatId, price, cancellationToken: token);
        }
        else if (messageText.StartsWith("/convert"))
        {
            string[] parts = messageText.Split(" ");
            if (parts.Length == 4)
            {
                decimal amount = decimal.Parse(parts[1]);
                string fromCurrency = parts[2];
                string toCurrency = parts[3];string converted = await ConvertCurrency(amount, fromCurrency, toCurrency);
                await bot.SendTextMessageAsync(chatId, converted, cancellationToken: token);
            }
        }
        else if (messageText.StartsWith("/password"))
        {
            string password = GeneratePassword();
            await bot.SendTextMessageAsync(chatId, $"🔒 Ваш пароль: {password}", cancellationToken: token);
        }
        else if (messageText.StartsWith("/qr"))
        {
            string text = messageText.Replace("/qr ", "").Trim();
            string qrPath = GenerateQRCode(text);
            await bot.SendPhotoAsync(chatId, new Telegram.Bot.Types.InputFileStream(File.OpenRead(qrPath)), cancellationToken: token);
        }
        else if (messageText.StartsWith("/ai"))
        {
            string query = messageText.Replace("/ai ", "").Trim();
            string response = await GetAIResponse(query);
            await bot.SendTextMessageAsync(chatId, response, cancellationToken: token);
        }
        else if (messageText.StartsWith("/download"))
        {
            string url = messageText.Replace("/download ", "").Trim();
            string mp3Path = await DownloadYouTubeMP3(url);
            await bot.SendAudioAsync(chatId, new Telegram.Bot.Types.InputFileStream(File.OpenRead(mp3Path)), cancellationToken: token);
        }
        else if (messageText.StartsWith("/reminder"))
        {
            string[] parts = messageText.Split(" ");
            if (parts.Length >= 3)
            {
                int minutes = int.Parse(parts[^1]);
                string reminderText = string.Join(" ", parts[1..^1]);
                await Task.Delay(TimeSpan.FromMinutes(minutes));
                await bot.SendTextMessageAsync(chatId, $"🔔 Напоминание: {reminderText}", cancellationToken: token);
            }
        }
    }

    private static async Task<string> GetWeather(string city) { return $"🌤 Погода в {city}: 20°C"; }
    private static async Task<string> GetNews() { return "📰 Новости: Новый AI вышел в продакшн."; }
    private static async Task<string> GetCurrencyRate(string currency) { return $"💰 Курс {currency}: 85 руб."; }
    private static async Task<string> GetCryptoPrice(string crypto) { return $"₿ Курс {crypto}: 50,000$"; }
    private static async Task<string> ConvertCurrency(decimal amount, string from, string to) { return $"{amount} {from} = {amount * 1.2m} {to}"; }
    private static string GeneratePassword() { return Guid.NewGuid().ToString("N").Substring(0, 10); }
    private static string GenerateQRCode(string text) { return "qr.png"; }
    private static async Task<string> GetAIResponse(string query) { return "🤖 AI ответ: Привет, как дела?"; }
    private static async Task<string> DownloadYouTubeMP3(string url) { return "music.mp3"; }

}