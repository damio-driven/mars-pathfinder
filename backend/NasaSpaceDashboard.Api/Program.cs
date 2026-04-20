using NasaSpaceDashboard.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add Memory Cache
builder.Services.AddMemoryCache();

// Add HttpClient for NasaApiService
builder.Services.AddHttpClient<NasaApiService>(client =>
{
    var timeoutSeconds = int.Parse(builder.Configuration["NasaApi:RequestTimeoutSeconds"] ?? "30");
    client.Timeout = TimeSpan.FromSeconds(timeoutSeconds);
});

// Add CORS policy for Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("Angular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Warn about API key early in dev
if (app.Environment.IsDevelopment())
{
    var apiKey = builder.Configuration["NasaApi:ApiKey"];
    if (string.IsNullOrEmpty(apiKey) || apiKey == "DEMO_KEY" || apiKey == "YOUR_NASA_API_KEY_HERE")
    {
        app.Use(async (ctx, next) =>
        {
            await ctx.Response.WriteAsync(
                "<div style='background:#fff3cd;color:#856404;padding:20px;margin:20px;border:1px solid #ffc107;border-radius:4px;font-family:sans-serif;'><h3>⚠️ NASA API Key not configured</h3><p>You are using the demo key which has a rate limit of 1 request per hour.</p><p>To get your own API key, visit <a href='https://api.nasa.gov' target='_blank'>api.nasa.gov</a>, register for a free account, and then set the key in <code>appsettings.Development.json</code> or via user secrets.</p></div>");
            await next();
        });
    }

    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Angular");

app.UseAuthorization();

app.MapControllers();

app.Run();
