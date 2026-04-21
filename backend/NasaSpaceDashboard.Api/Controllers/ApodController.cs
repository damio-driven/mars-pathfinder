using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using NasaSpaceDashboard.Api.Models;
using NasaSpaceDashboard.Api.Services;

namespace NasaSpaceDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApodController : ControllerBase
{
    private readonly NasaApiService _nasaApiService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ApodController> _logger;

    public ApodController(
        NasaApiService nasaApiService,
        IMemoryCache cache,
        ILogger<ApodController> logger)
    {
        _nasaApiService = nasaApiService;
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Get APOD (Astronomy Picture of the Day)
    /// </summary>
    /// <param name="date">Optional date in YYYY-MM-DD format</param>
    /// <param name="count">Optional count for random gallery (max 10). When provided, returns an array.</param>
    [HttpGet]
    public async Task<ActionResult<object>> GetApod([FromQuery] string? date = null, [FromQuery] int? count = null)
    {
        if (count.HasValue)
        {
            // Gallery mode - return array
            var galleryCacheKey = $"apod-gallery-{count}";

            if (_cache.TryGetValue(galleryCacheKey, out List<ApodDto>? cachedList))
            {
                _logger.LogInformation("APOD gallery returned from cache with key {CacheKey}", galleryCacheKey);
                return Ok(cachedList);
            }

            try
            {
                var list = await _nasaApiService.GetApodGalleryAsync(date, count.Value);

                if (list == null || list.Count == 0)
                {
                    return NotFound("Unable to fetch APOD gallery data");
                }

                var cacheEntryOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
                };

                _cache.Set(galleryCacheKey, list, cacheEntryOptions);
                _logger.LogInformation("APOD gallery fetched from NASA API and cached with key {CacheKey}, count={Count}", galleryCacheKey, list.Count);

                return Ok(list);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching APOD gallery");
                return StatusCode(500, "Internal server error");
            }
        }

        // Single APOD mode
        // Validate future dates
        if (!string.IsNullOrEmpty(date))
        {
            if (DateTime.TryParse(date, out var parsedDate))
            {
                var today = DateTime.Today;
                if (parsedDate.Date > today)
                {
                    _logger.LogWarning("Requested APOD for future date {FutureDate}", date);
                    return BadRequest(new { message = $"La data '{date}' non è valida: non esistono APOD per date future." });
                }
            }
            else
            {
                return BadRequest(new { message = "Formato data non valido. Usare YYYY-MM-DD." });
            }
        }

        var cacheKey = string.IsNullOrEmpty(date)
            ? "apod-today"
            : $"apod-{date}";

        if (_cache.TryGetValue(cacheKey, out ApodDto? cachedApod))
        {
            _logger.LogInformation("APOD returned from cache with key {CacheKey}", cacheKey);
            return Ok(cachedApod);
        }

        try
        {
            var apod = await _nasaApiService.GetApodAsync(date);

            if (apod == null)
            {
                return NotFound("Unable to fetch APOD data");
            }

            // Cache for 1 hour
            var cacheEntryOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1)
            };

            _cache.Set(cacheKey, apod, cacheEntryOptions);
            _logger.LogInformation("APOD fetched from NASA API and cached with key {CacheKey}", cacheKey);

            return Ok(apod);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching APOD");
            return StatusCode(500, "Internal server error");
        }
    }
}
