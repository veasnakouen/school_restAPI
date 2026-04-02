namespace SchoolAPI.Helpers;

public static class ImageValidation
{
    public const long MaxFileSizeBytes = 5 * 1024 * 1024;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    };

    public static string? Validate(IFormFile? file)
    {
        if (file == null || file.Length <= 0)
        {
            return "Image file is required.";
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return "Image size must be 5 MB or smaller.";
        }

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
        {
            return "Only JPG, JPEG, PNG, and WEBP images are allowed.";
        }

        if (!string.IsNullOrWhiteSpace(file.ContentType) && !file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            return "The uploaded file must be an image.";
        }

        return null;
    }
}