using MediatR;

public record DeletePermissionCommand(int Id) : IRequest<bool>;
