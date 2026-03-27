using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolAPI.Application.Features.Auth.Commands.Login;
using SchoolAPI.Application.Features.Auth.Commands.Register;
using SchoolAPI.Application.Features.Auth.Commands.Refresh;
using SchoolAPI.Application.Features.Auth.Commands.UpdateProfile;
using SchoolAPI.Application.Features.Auth.Queries.GetProfile;
using SchoolAPI.Application.Features.Auth.Queries.GetUser;
using SchoolAPI.Application.Features.Auth.Queries.GetUsers;
using SchoolAPI.Constant;
using SchoolAPI.Constant.Auth;
using SchoolAPI.Contracts.Auth;
using SchoolAPI.Data;
using SchoolAPI.Entities;

namespace SchoolAPI.Controllers;

/// <summary>
/// Authentication controller following CQRS and Clean Architecture patterns
/// </summary>
public class AuthController : BaseController
{
    private readonly IMediator _mediator;
    private readonly UserManager<AppUser> _userManager;
    private readonly SchoolDbContext _context;

    public AuthController(
        IMediator mediator,
        UserManager<AppUser> userManager,
        SchoolDbContext context)
    {
        _mediator = mediator;
        _userManager = userManager;
        _context = context;
    }

    // without UserManager
    //not yet working
    [HttpPost("user register")]
    [AllowAnonymous]
    public async Task<ActionResult<UserDto>> RegisterUser([FromBody] RegisterDto dto)
    {
        var command = new RegisterCommand(
            Email: dto.Email,
            Password: dto.Password,
            FullName: dto.Username,
            Roles: dto.Roles?.ToList());

        var result = await _mediator.Send(command);
        
        if (!result.IsSuccess)
            return BadRequest(result.Message);

        return Ok(result);
    }

    [HttpPost("LoginUser")]
    [AllowAnonymous]
    public async Task<ActionResult<UserDto>> LoginUser([FromBody] LoginRequest dto)
    {
        var command = new LoginCommand(dto.Email, dto.Password);
        var result = await _mediator.Send(command);
        
        if (!result.IsSuccess)
            return Unauthorized(result.Message);

        return Ok(result);
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var command = new RegisterCommand(
            Email: request.Email,
            Password: request.Password,
            FullName: request.FullName,
            Roles: request.Roles);

        var result = await _mediator.Send(command);
        
        if (!result.IsSuccess)
            return BadRequest(result.Message);

        return Ok(result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var command = new LoginCommand(request.Email, request.Password);
        var result = await _mediator.Send(command);
        
        if (!result.IsSuccess)
            return Unauthorized(result.Message);

        return Ok(result);
    }


    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var command = new RefreshTokenCommand(request.AccessToken, request.RefreshToken);
        var result = await _mediator.Send(command);
        
        if (!result.IsSuccess)
            return Unauthorized(result.Message);

        return Ok(result);
    }

    //TODO: update profile
    [HttpPost("update-profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UserDetail request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized("User not found.");

        var command = new UpdateProfileCommand(
            UserId: userId,
            FullName: request.FullName,
            PhoneNumber: request.PhoneNumber,
            Roles: request.Roles);

        var result = await _mediator.Send(command);
        
        if (!result.IsSuccess)
            return BadRequest(result.Message);

        return Ok(result);
    }


    [HttpGet("profile")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized("User not found.");

        var query = new GetProfileQuery(userId);
        var result = await _mediator.Send(query);
        
        if (!result.IsSuccess)
            return NotFound(result.Message);

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetUser(string id)
    {
        var query = new GetUserQuery(id);
        var result = await _mediator.Send(query);
        
        if (!result.IsSuccess)
            return NotFound(result.Message);

        return Ok(result);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers(string? filterOn = null, string? filterQuery = null)
    {
        var query = new GetUsersQuery(filterOn, filterQuery);
        var result = await _mediator.Send(query);
        
        if (!result.IsSuccess)
            return BadRequest(result.Message);

        return Ok(result);
    }

    //
    [HttpGet("details")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<UserDetail>> GetUserDetail(string id)
    {
        var query = new GetUserQuery(id);
        var result = await _mediator.Send(query);
        
        if (!result.IsSuccess)
            return NotFound(result.Message);

        return Ok(result);
    }

    [HttpGet("AllUsers")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<AppUser>>> GetUsers()
    {
        var query = new GetUsersQuery();
        var result = await _mediator.Send(query);
        
        if (!result.IsSuccess)
            return BadRequest(result.Message);

        return Ok(result.Users);
    }
}
