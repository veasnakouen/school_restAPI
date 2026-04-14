using MediatR;

public record UpdatePermissionCommand(int Id, string Name) : IRequest<bool>;
