using NasaSpaceDashboard.Api.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace NasaSpaceDashboard.Api.Services;

public class NasaApiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<NasaApiService> _logger;
    private static readonly JsonSerializerOptions JsonSerializerOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public NasaApiService(HttpClient httpClient, IConfiguration configuration, ILogger<NasaApiService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    private string ApiKey => _configuration["NasaApi:ApiKey"] switch
    {
        null or "" or "DEMO_KEY" or "YOUR_NASA_API_KEY_HERE" => "DEMO_KEY",
        var key => key
    };

    private string BaseUrl => _configuration["NasaApi:BaseUrl"] ?? "https://api.nasa.gov";

    private bool _apiKeyWarningLogged = false;

    private string EnsureApiKey()
    {
        var key = ApiKey;
        if (key == "DEMO_KEY" && !_apiKeyWarningLogged)
        {
            _logger.LogWarning("Using NASA DEMO_KEY. Rate limit is 1 request/hour. " +
                "Get your own key at https://api.nasa.gov and set it in appsettings.Development.json or via user secrets.");
            _apiKeyWarningLogged = true;
        }
        return key;
    }

    public async Task<ApodDto?> GetApodAsync(string? date = null)
    {
        var key = EnsureApiKey();
        var endpoint = $"{BaseUrl}/planetary/apod?api_key={key}";

        if (!string.IsNullOrEmpty(date))
        {
            endpoint += $"&date={date}";
        }

        var response = await _httpClient.GetAsync(endpoint);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("APOD API returned status {StatusCode}", error);
            return null;
        }

        using var stream = await response.Content.ReadAsStreamAsync();
        var apod = await JsonSerializer.DeserializeAsync<ApodDtoInternal>(stream, JsonSerializerOptions);
        if (apod == null)
        {
            return null;
        }

        return new ApodDto(
            apod.Title ?? "",
            apod.Date ?? "",
            apod.Explanation ?? "",
            apod.Url ?? "",
            apod.HdUrl ?? "",
            apod.MediaType ?? "image",
            apod.Copyright ?? ""
        );
    }

    public async Task<List<ApodDto>> GetApodGalleryAsync(string? date, int count)
    {
        var key = EnsureApiKey();
        var endpoint = $"{BaseUrl}/planetary/apod?api_key={key}&count={count}";

        if (!string.IsNullOrEmpty(date))
        {
            endpoint += $"&date={date}";
        }

        var response = await _httpClient.GetAsync(endpoint);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("APOD Gallery API returned status {StatusCode}", response.StatusCode);
            return [];
        }

        using var stream = await response.Content.ReadAsStreamAsync();
        var apodList = await JsonSerializer.DeserializeAsync<List<ApodDtoInternal>>(stream, JsonSerializerOptions);
        if (apodList == null || apodList.Count == 0)
        {
            return [];
        }

        return apodList.Select(a => new ApodDto(
            a.Title ?? "",
            a.Date ?? "",
            a.Explanation ?? "",
            a.Url ?? "",
            a.HdUrl ?? "",
            a.MediaType ?? "image",
            a.Copyright ?? ""
        )).ToList();
    }

    public async Task<List<NeoDto>> GetNearEarthObjectsAsync(string startDate, string endDate)
    {
        var endpoint = $"{BaseUrl}/neo/rest/v1/feed?start_date={startDate}&end_date={endDate}&api_key={ApiKey}";

        var response = await _httpClient.GetAsync(endpoint);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError(error);
            return [];
        }
        /*else
        {
            var stringResponse = await response.Content.ReadAsStringAsync();
            _logger.LogTrace(stringResponse);
            var myDeserialize = JsonSerializer.Deserialize<NeoResponse>(stringResponse);
        }*/

        using var stream = await response.Content.ReadAsStreamAsync();
        var neoResponse = await JsonSerializer.DeserializeAsync<NeoResponse>(stream, JsonSerializerOptions);

        if (neoResponse?.NearEarthObjects == null)
        {
            return [];
        }

        var result = new List<NeoDto>();
        foreach (var kvp in neoResponse.NearEarthObjects)
        {
            if (kvp.Value == null) continue;

            foreach (var neo in kvp.Value)
            {
                var closeApproachData = neo.CloseApproachData?.FirstOrDefault();
                if (closeApproachData == null) continue;

                var missDistanceKm = double.TryParse(
                    closeApproachData.MissDistance?.Kilometers,
                    System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture,
                    out var missDist) ? missDist : 0;

                var relativeVelocityKmH = double.TryParse(
                    closeApproachData.RelativeVelocity?.KilometersPerHour,
                    System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture,
                    out var relVel) ? relVel : 0;

                var diameterMin = neo.EstimatedDiameter?.Kilometers?.EstimatedDiameterMin ?? 0;

                var diameterMax = neo.EstimatedDiameter?.Kilometers?.EstimatedDiameterMax ?? 0;

                result.Add(new NeoDto(
                    neo.Id?.ToString() ?? "",
                    neo.Name ?? "",
                    neo.IsPotentiallyHazardousAsteroid,
                    diameterMin,
                    diameterMax,
                    missDistanceKm,
                    relativeVelocityKmH,
                    closeApproachData.CloseApproachDate ?? ""
                ));
            }
        }

        return result;
    }

    public async Task<List<MarsPhotoDto>> GetMarsPhotosAsync(
        string rover,
        int sol,
        string? camera = null,
        int page = 0)
    {
        var endpoint = $"{BaseUrl}/mars-photos/api/v1/rovers/{rover}/photos?sol={sol}&page={page}&api_key={ApiKey}";

        if (!string.IsNullOrEmpty(camera))
        {
            endpoint += $"&camera={camera}";
        }

        var response = await _httpClient.GetAsync(endpoint);
        if (!response.IsSuccessStatusCode)
        {
            return [];
        }

        using var stream = await response.Content.ReadAsStreamAsync();
        var marsResponse = await JsonSerializer.DeserializeAsync<MarsResponse>(stream, JsonSerializerOptions);

        if (marsResponse?.Photos == null)
        {
            return [];
        }

        return marsResponse.Photos.Select(p => new MarsPhotoDto(
            p.Id,
            p.ImgSrc ?? "",
            p.Camera?.FullName ?? "",
            p.Camera?.Name ?? "",
            p.Rover?.Name ?? "",
            p.EarthDate ?? "",
            p.Sol
        )).ToList();
    }

    public async Task<PhotoResult?> DownloadPhotoAsync(string url)
    {
        try
        {
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var content = await response.Content.ReadAsByteArrayAsync();
            if (content?.Length == 0)
            {
                return null;
            }

            var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";
            return new PhotoResult { Content = content, ContentType = contentType };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to download image from {Url}", url);
            return null;
        }
    }
}

// DTOs per le risposte delle API
public class ApodResponse
{
    public ApodDtoInternal? Single { get; set; }
    public List<ApodDtoInternal>? ApodList { get; set; }
}

public class ApodDtoInternal
{
    public string? Title { get; set; }
    public string? Date { get; set; }
    public string? Explanation { get; set; }
    public string? Url { get; set; }
    public string? HdUrl { get; set; }
    public string? MediaType { get; set; }
    public string? Copyright { get; set; }
}

public class NeoResponse
{
    [JsonPropertyName("near_earth_objects")]
    public Dictionary<string, List<NeoDtoInternal>?>? NearEarthObjects { get; set; }
}

public class NeoDtoInternal
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }
    
    [JsonPropertyName("name")]
    public string? Name { get; set; }
    
    [JsonPropertyName("is_potentially_hazardous_asteroid")]
    public bool IsPotentiallyHazardousAsteroid { get; set; }
    
    [JsonPropertyName("estimated_diameter")]
    public EstimatedDiameter? EstimatedDiameter { get; set; }
    
    [JsonPropertyName("close_approach_data")]
    public List<CloseApproachData>? CloseApproachData { get; set; }
}

public class EstimatedDiameter
{
    public DiameterValue? Kilometers { get; set; }
}

public class DiameterValue
{
    [JsonPropertyName("estimated_diameter_min")]
    public double? EstimatedDiameterMin { get; set; }

    [JsonPropertyName("estimated_diameter_max")]
    public double? EstimatedDiameterMax { get; set; }
}

public class CloseApproachData
{
    [JsonPropertyName("close_approach_date")]
    public string? CloseApproachDate { get; set; }
    
    [JsonPropertyName("miss_distance")]
    public MissDistance? MissDistance { get; set; }
    
    [JsonPropertyName("relative_velocity")]
    public RelativeVelocity? RelativeVelocity { get; set; }
}

public class MissDistance
{
    [JsonPropertyName("kilometers")]
    public string? Kilometers { get; set; }
}

public class RelativeVelocity
{
    [JsonPropertyName("kilometers_per_hour")]
    public string? KilometersPerHour { get; set; }
}

public class MarsResponse
{
    public List<MarsPhotoInternal>? Photos { get; set; }
}

public class MarsPhotoInternal
{
    public int Id { get; set; }
    public string? ImgSrc { get; set; }
    public Camera? Camera { get; set; }
    public string? EarthDate { get; set; }
    public int Sol { get; set; }
    public Rover? Rover { get; set; }
}

public class Camera
{
    public string? Name { get; set; }
    public string? FullName { get; set; }
}

public class Rover
{
    public string? Name { get; set; }
}

public class PhotoResult
{
    public byte[] Content { get; set; } = [];
    public string ContentType { get; set; } = "";
}
