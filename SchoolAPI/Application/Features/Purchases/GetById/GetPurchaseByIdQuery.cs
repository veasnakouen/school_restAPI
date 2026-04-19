using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Purchases.GetById;

public record GetPurchaseByIdQuery(string PurchaseId) : IRequest<Result<PurchaseDto>>;