using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.StockMovements.GetAll
{
    public record GetAllStockMovementsQuery(
        string? filterOn,
        string? filterQuery,
        string? sortBy,
        bool isAscending,
        int pageNumber,
        int pageSize) : IRequest<Result<PagedResult<StockMovementDto>>>;
}
