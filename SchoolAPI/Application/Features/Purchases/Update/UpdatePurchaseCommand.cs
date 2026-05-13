using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Purchases.Update;

public record UpdatePurchaseCommand(string PurchaseId, UpdatePurchaseRequest Request) : IRequest<Result<PurchaseDto>>;