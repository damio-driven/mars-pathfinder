using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using NasaSpaceDashboard.Api.Services;

namespace NasaSpaceDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImagesController : ControllerBase
{
    private readonly NasaApiService _nasaApiService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ImagesController> _logger;

    public ImagesController(
        NasaApiService nasaApiService,
        IMemoryCache cache,
        ILogger<ImagesController> logger)
    {
        _nasaApiService = nasaApiService;
        _cache = cache;
        _logger = logger;
    }

    /// <summary>
    /// Generic image proxy for any NASA image URL
    /// </summary>
    [HttpGet("proxy")]
    public async Task<IActionResult> Get([FromQuery] string url)
    {
        if (string.IsNullOrEmpty(url))
        {
            return BadRequest("URL is required");
        }

        var cacheKey = $"img-{Uri.EscapeDataString(url)}";

        if (_cache.TryGetValue(cacheKey, out byte[]? cachedImage) && cachedImage != null)
        {
            return File(cachedImage, "image/jpeg");
        }

        try
        {
            var result = await _nasaApiService.DownloadPhotoAsync(url);

            if (result is null)
            {
                return NotFound("Image not found");
            }

            var contentType = result.ContentType;
            var imageBytes = result.Content;

            var cacheEntryOptions = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(24)
            };
            cacheEntryOptions.SetSize(imageBytes.Length);

            _cache.Set(cacheKey, imageBytes, cacheEntryOptions);

            return File(imageBytes, contentType);
        }
        catch
        {
            return StatusCode(502, "Failed to fetch image");
        }
    }
}
