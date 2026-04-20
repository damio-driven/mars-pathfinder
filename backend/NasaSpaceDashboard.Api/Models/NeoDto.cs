namespace NasaSpaceDashboard.Api.Models;

public record NeoDto(
    string Id,
    string Name,
    bool IsPotentiallyHazardous,
    double DiameterMinKm,
    double DiameterMaxKm,
    double MissDistanceKm,
    double RelativeVelocityKmH,
    string CloseApproachDate
);
