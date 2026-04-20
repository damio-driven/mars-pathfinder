namespace NasaSpaceDashboard.Api.Models;

public record ApodDto(
    string Title,
    string Date,
    string Explanation,
    string Url,
    string HdUrl,
    string MediaType,
    string Copyright
);
