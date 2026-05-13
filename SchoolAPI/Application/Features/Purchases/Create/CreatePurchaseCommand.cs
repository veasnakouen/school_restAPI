using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Purchases.Create;

public record CreatePurchaseCommand(CreatePurchaseRequest Request) : IRequest<Result<PurchaseDto>>;