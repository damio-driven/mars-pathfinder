namespace NasaSpaceDashboard.Api.Models;

public record MarsPhotoDto(
    int Id,
    string ImgSrc,
    string CameraFullName,
    string CameraAbbreviation,
    string RoverName,
    string EarthDate,
    int Sol
);
