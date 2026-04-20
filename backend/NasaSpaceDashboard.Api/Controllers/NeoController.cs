using Microsoft.AspNetCore.Mvc;
using NasaSpaceDashboard.Api.Models;
using NasaSpaceDashboard.Api.Services;

namespace NasaSpaceDashboard.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NeoController : ControllerBase
{
    private readonly NasaApiService _nasaApiService;
    private readonly ILogger<NeoController> _logger;

    public NeoController(
        NasaApiService nasaApiService,
        ILogger<NeoController> logger)
    {
        _nasaApiService = nasaApiService;
        _logger = logger;
    }

    /// <summary>
    /// Get Near Earth Objects within a date range (max 7 days)
    /// </summary>
    /// <param name="startDate">Start date in YYYY-MM-DD format</param>
    /// <param name="endDate">End date in YYYY-MM-DD format</param>
    [HttpGet]
    public async Task<ActionResult<List<NeoDto>>> GetNearEarthObjects(
        [FromQuery] string? startDate = null,
        [FromQuery] string? endDate = null)
    {
        // Default to today → today+1 if dates not fully provided
        if (string.IsNullOrEmpty(startDate))
        {
            startDate = DateTime.Today.ToString("yyyy-MM-dd");
        }
        if (string.IsNullOrEmpty(endDate))
        {
            var parsed = DateTime.Parse(startDate);
            endDate = parsed.AddDays(1).ToString("yyyy-MM-dd");
        }

        // Validate date format
        if (!DateTime.TryParse(startDate, out var start) || !DateTime.TryParse(endDate, out var end))
        {
            return BadRequest("Invalid date format. Use YYYY-MM-DD");
        }

        // Validate range (max 7 days)
        var range = (end - start).Days;
        if (range < 0)
        {
            return BadRequest("End date must be after start date");
        }
        if (range > 7)
        {
            return BadRequest("Date range cannot exceed 7 days");
        }

        try
        {
            var neos = await _nasaApiService.GetNearEarthObjectsAsync(startDate, endDate);
            _logger.LogInformation("Retrieved {Count} NEOs for range {Start} to {End}", neos.Count, startDate, endDate);
            return Ok(neos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching NEO data");
            return StatusCode(500, "Internal server error");
        }
    }
}
