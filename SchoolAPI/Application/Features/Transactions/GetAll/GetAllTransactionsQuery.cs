using MediatR;
using SchoolAPI.Application.Common.Models;
using SchoolAPI.Contracts;

namespace SchoolAPI.Application.Features.Transactions.GetAll;

public record GetAllTransactionsQuery(
	string? filterOn = null,
	string? filterQuery = null,
	string? sortBy = null,
	bool isAscending = true,
	int pageNumber = 1,
	int pageSize = 10) : IRequest<Result<PagedResult<TransactionDto>>>;
