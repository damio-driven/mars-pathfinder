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
        var url = $"/planetary/apod?api_key={key}";

        if (!string.IsNullOrEmpty(date))
        {
            url += $"&date={date}";
        }

        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("APOD API returned status {StatusCode}", response.StatusCode);
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
        var url = $"/planetary/apod?api_key={key}&count={count}";

        if (!string.IsNullOrEmpty(date))
        {
            url += $"&date={date}";
        }

        var response = await _httpClient.GetAsync(url);
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
        var url = $"/neo/rest/v1/feed?start_date={startDate}&end_date={endDate}&api_key={ApiKey}";

        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("NEO API returned status {StatusCode}: {Error}", response.StatusCode, error);
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
        int page = 1,
        int count = 100)
    {
        var validRovers = new[] { "curiosity", "spirit", "opportunity", "perseverance" };
        var roverLower = rover.Trim().ToLowerInvariant();

        if (!validRovers.Contains(roverLower))
        {
            _logger.LogError("Invalid rover name: '{Rover}'. Valid values are: {ValidRovers}",
                rover, string.Join(", ", validRovers));
            return [];
        }

        var key = EnsureApiKey();
        var url = $"/mars-photos/api/v1/rovers/{roverLower}/photos?sol={sol}&page={page}&api_key={key}";

        if (!string.IsNullOrEmpty(camera))
        {
            url += $"&camera={camera}";
        }

        if (count > 0)
        {
            url += $"&count={count}";
        }

        var fullUrl = $"{BaseUrl}{url}";

        _logger.LogTrace("Calling Mars Photos API: {Endpoint}", fullUrl);

        var response = await _httpClient.GetAsync(fullUrl);
        if (!response.IsSuccessStatusCode)
        {
            var responseBody = await response.Content.ReadAsStringAsync();
            _logger.LogError("Mars Photos API returned status {StatusCode}: {Body}", response.StatusCode, responseBody);
            return [];
        }

        var responseBodyString = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseBodyString);
        var root = doc.RootElement;

        // Response format: { "code": 200, "status": "success", "photos": [...] }
        if (!root.TryGetProperty("photos", out var photosElement) || photosElement.GetArrayLength() == 0)
        {
            _logger.LogWarning("Mars Photos API response has no photos");
            return [];
        }

        var result = new List<MarsPhotoDto>();
        var idCounter = page > 1 ? (page - 1) * 100 : 0;

        foreach (var photo in photosElement.EnumerateArray())
        {
            var imgSrc = photo.TryGetProperty("img_src", out var imgSrcProp)
                ? imgSrcProp.GetString()
                : null;

            if (string.IsNullOrEmpty(imgSrc)) continue;

            // Safely access nested camera properties without using JsonElement.Null
            string? camName = null;
            string? camFullName = null;
            if (photo.TryGetProperty("camera", out var cameraProp))
            {
                camName = cameraProp.TryGetProperty("name", out var camNameProp) ? camNameProp.GetString() : null;
                camFullName = cameraProp.TryGetProperty("full_name", out var camFullNameProp) ? camFullNameProp.GetString() : null;
            }

            // Safely access nested rover properties
            string? roverName = null;
            if (photo.TryGetProperty("rover", out var roverProp))
            {
                roverName = roverProp.TryGetProperty("name", out var roverNameProp) ? roverNameProp.GetString() : null;
            }
            roverName ??= roverLower;

            var earthDate = photo.TryGetProperty("earth_date", out var earthDateProp)
                ? earthDateProp.GetString()
                : null;

            var solVal = 0;
            if (photo.TryGetProperty("sol", out var solProp) && solProp.TryGetInt32(out var solInt))
            {
                solVal = solInt;
            }

            result.Add(new MarsPhotoDto(
                Id: ++idCounter,
                ImgSrc: imgSrc!,
                CameraFullName: camFullName ?? camName ?? "",
                CameraAbbreviation: camName ?? "",
                RoverName: roverName ?? roverLower,
                EarthDate: earthDate ?? "",
                Sol: solVal
            ));
        }

        _logger.LogInformation("Retrieved {Count} photos for rover '{Rover}', sol {Sol}", result.Count, rover, sol);

        return result;
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
            return new PhotoResult { Content = content, ContentType = contentType! };
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

public class PhotoResult
{
    public byte[] Content { get; set; } = [];
    public string ContentType { get; set; } = "";
}
