using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using NasaSpaceDashboard.Api.Models;
using NasaSpaceDashboard.Api.Services;

namespace NasaSpaceDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MarsController : ControllerBase
{
    private readonly NasaApiService _nasaApiService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<MarsController> _logger;

    public MarsController(
        NasaApiService nasaApiService,
        IMemoryCache cache,
        ILogger<MarsController> logger)
    {
        _nasaApiService = nasaApiService;
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Get Mars Rover photos
    /// </summary>
    /// <param name="rover">Rover name: curiosity, opportunity, spirit, perseverance</param>
    /// <param name="sol">Martian sol (day)</param>
    /// <param name="camera">Optional camera filter</param>
    /// <param name="page">Page number (default 0)</param>
    [HttpGet]
    public async Task<ActionResult<List<MarsPhotoDto>>> GetMarsPhotos(
        [FromQuery] string? rover = null,
        [FromQuery] int? sol = null,
        [FromQuery] string? camera = null,
        [FromQuery] int page = 0)
    {
        // Default to Curiosity and today's sol if not specified
        if (string.IsNullOrEmpty(rover))
        {
            rover = "curiosity";
        }

        if (sol == null || sol <= 0)
        {
            sol = 1000; // Default sol
        }

        // Validate rover name
        var validRovers = new[] { "curiosity", "opportunity", "spirit", "perseverance" };
        if (!validRovers.Contains(rover.ToLower()))
        {
            return BadRequest($"Invalid rover name. Valid options: {string.Join(", ", validRovers)}");
        }

        // Cache key based on parameters
        var cacheKey = $"mars-{rover}-{sol}-{camera ?? "all"}-{page}";

        if (_cache.TryGetValue(cacheKey, out List<MarsPhotoDto>? cachedPhotos))
        {
            _logger.LogInformation("Mars photos returned from cache with key {CacheKey}", cacheKey);
            return Ok(cachedPhotos);
        }

        try
        {
            var photos = await _nasaApiService.GetMarsPhotosAsync(rover.ToLower(), sol.Value, camera, page);

            // Transform imgSrc to use backend consolidated image proxy (avoids 403 from images.nasa.gov)
            var proxyBaseUrl = Request.Scheme + "://" + Request.Host;
            var proxyPhotos = photos.Select(p => p with { ImgSrc = $"{proxyBaseUrl}/api/images/proxy?url={Uri.EscapeDataString(p.ImgSrc)}" }).ToList();

            _logger.LogInformation("Retrieved {Count} Mars photos for rover {Rover} sol {Sol}", proxyPhotos.Count, rover, sol);

            // Cache for 30 minutes
            var cacheEntryOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
            };

            _cache.Set(cacheKey, proxyPhotos, cacheEntryOptions);

            return Ok(proxyPhotos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching Mars photos");
            return StatusCode(500, "Internal server error");
        }
    }
}
