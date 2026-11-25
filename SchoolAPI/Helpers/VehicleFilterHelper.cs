using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Entities;

namespace SchoolAPI.Helpers;

public static class VehicleFilterHelper
{
    public static IQueryable<Product> ApplyProductVehicleFilter(IQueryable<Product> query, string? vehicleType)
    {
        var predicate = BuildProductPredicate(vehicleType);
        return predicate == null ? query : query.Where(predicate);
    }

    public static IQueryable<Transaction> ApplyTransactionVehicleFilter(IQueryable<Transaction> query, string? vehicleType)
    {
        var productPredicate = BuildProductPredicate(vehicleType);
        if (productPredicate == null) return query;

        var txParam = Expression.Parameter(typeof(Transaction), "t");
        var productNav = Expression.Property(txParam, nameof(Transaction.Product));
        var rewrittenBody = new ParameterReplacer(productPredicate.Parameters[0], productNav)
            .Visit(productPredicate.Body);
        var lambda = Expression.Lambda<Func<Transaction, bool>>(rewrittenBody, txParam);
        return query.Where(lambda);
    }

    public static string? FormatVehicleFilterLabel(string? vehicleType) => vehicleType?.Trim().ToLowerInvariant() switch
    {
        "motor" => "Motor / Motorcycle",
        "car" => "Car / Van / Truck",
        "vehicle" or "allvehicles" => "All Vehicles (Motor & Car)",
        _ => null
    };

    private static Expression<Func<Product, bool>>? BuildProductPredicate(string? vehicleType)
    {
        if (string.IsNullOrWhiteSpace(vehicleType)) return null;

        return vehicleType.Trim().ToLowerInvariant() switch
        {
            "motor" => p =>
                EF.Functions.ILike(p.ProductName, "%motor%") ||
                EF.Functions.ILike(p.ProductName, "%moto%") ||
                EF.Functions.ILike(p.ProductName, "%scooter%") ||
                EF.Functions.ILike(p.ProductName, "%motorbike%") ||
                EF.Functions.ILike(p.ProductName, "%honda%") ||
                EF.Functions.ILike(p.ProductName, "%yamaha%") ||
                EF.Functions.ILike(p.ProductName, "%vespa%") ||
                (p.Category != null && (
                    EF.Functions.ILike(p.Category.Name, "%motor%") ||
                    EF.Functions.ILike(p.Category.Name, "%moto%") ||
                    EF.Functions.ILike(p.Category.Name, "%bike%"))),

            "car" => p =>
                EF.Functions.ILike(p.ProductName, "%car%") ||
                EF.Functions.ILike(p.ProductName, "%toyota%") ||
                EF.Functions.ILike(p.ProductName, "%hilux%") ||
                EF.Functions.ILike(p.ProductName, "%ford%") ||
                EF.Functions.ILike(p.ProductName, "%pickup%") ||
                EF.Functions.ILike(p.ProductName, "%van%") ||
                EF.Functions.ILike(p.ProductName, "%truck%") ||
                EF.Functions.ILike(p.ProductName, "%suv%") ||
                EF.Functions.ILike(p.ProductName, "%sedan%") ||
                EF.Functions.ILike(p.ProductName, "%bus%") ||
                EF.Functions.ILike(p.ProductName, "%isuzu%") ||
                EF.Functions.ILike(p.ProductName, "%mitsubishi%") ||
                (p.Category != null && (
                    EF.Functions.ILike(p.Category.Name, "%car%") ||
                    EF.Functions.ILike(p.Category.Name, "%auto%") ||
                    EF.Functions.ILike(p.Category.Name, "%van%") ||
                    EF.Functions.ILike(p.Category.Name, "%truck%") ||
                    EF.Functions.ILike(p.Category.Name, "%pickup%") ||
                    ((EF.Functions.ILike(p.Category.Name, "%vehicle%") ||
                      EF.Functions.ILike(p.Category.Name, "%transport%")) &&
                     !EF.Functions.ILike(p.Category.Name, "%motor%") &&
                     !EF.Functions.ILike(p.Category.Name, "%moto%") &&
                     !EF.Functions.ILike(p.Category.Name, "%bike%")))),

            "vehicle" or "allvehicles" => p =>
                !string.IsNullOrEmpty(p.PlateNumber) ||
                !string.IsNullOrEmpty(p.EngineNumber) ||
                EF.Functions.ILike(p.ProductName, "%motor%") ||
                EF.Functions.ILike(p.ProductName, "%moto%") ||
                EF.Functions.ILike(p.ProductName, "%scooter%") ||
                EF.Functions.ILike(p.ProductName, "%car%") ||
                EF.Functions.ILike(p.ProductName, "%toyota%") ||
                EF.Functions.ILike(p.ProductName, "%ford%") ||
                EF.Functions.ILike(p.ProductName, "%pickup%") ||
                EF.Functions.ILike(p.ProductName, "%van%") ||
                EF.Functions.ILike(p.ProductName, "%truck%") ||
                EF.Functions.ILike(p.ProductName, "%vehicle%") ||
                (p.Category != null && (
                    EF.Functions.ILike(p.Category.Name, "%vehicle%") ||
                    EF.Functions.ILike(p.Category.Name, "%transport%") ||
                    EF.Functions.ILike(p.Category.Name, "%motor%") ||
                    EF.Functions.ILike(p.Category.Name, "%moto%") ||
                    EF.Functions.ILike(p.Category.Name, "%bike%") ||
                    EF.Functions.ILike(p.Category.Name, "%car%"))),

            _ => null
        };
    }

    private sealed class ParameterReplacer(ParameterExpression source, Expression target) : ExpressionVisitor
    {
        protected override Expression VisitParameter(ParameterExpression node) => node == source ? target : base.VisitParameter(node);
    }
}
