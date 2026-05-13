using MediatR;
using SchoolAPI.Application.Common.Models;

namespace SchoolAPI.Application.Features.Purchases.Delete;

public record DeletePurchaseCommand(string PurchaseId) : IRequest<Result<Unit>>;