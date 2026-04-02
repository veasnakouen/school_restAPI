using System.Text;

namespace SchoolAPI.Helpers;

public static class CacheKeyBuilder
{
    public static string BuildProductListKey(string version, string? filterOn, string? filterQuery, string? sortBy, bool isAscending, int pageNumber, int pageSize)
    {
        return string.Join(
            ':',
            "products",
            version,
            Normalize(filterOn),
            Normalize(filterQuery),
            Normalize(sortBy),
            isAscending ? "asc" : "desc",
            pageNumber,
            pageSize);
    }

    public static string BuildProductByIdKey(string version, string productId)
    {
        return string.Join(':', "product", version, Normalize(productId));
    }

    public static string BuildTransactionListKey(string version, string? filterOn, string? filterQuery, string? sortBy, bool isAscending, int pageNumber, int pageSize)
    {
        return string.Join(
            ':',
            "transactions",
            version,
            Normalize(filterOn),
            Normalize(filterQuery),
            Normalize(sortBy),
            isAscending ? "asc" : "desc",
            pageNumber,
            pageSize);
    }

    public static string BuildAcademicListKey(string entity, string version, string? filterOn, string? filterQuery, string? sortBy, bool isAscending, int pageNumber, int pageSize)
    {
        return string.Join(
            ':',
            entity,
            version,
            Normalize(filterOn),
            Normalize(filterQuery),
            Normalize(sortBy),
            isAscending ? "asc" : "desc",
            pageNumber,
            pageSize);
    }

    private static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "*";
        }

        return value.Trim().ToLowerInvariant();
    }
}